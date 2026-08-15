import asyncio
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import UUID

import pymupdf as fitz
from sqlalchemy import delete, select

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.document import Chunk, Document, DocumentSection, DocumentStatus
from app.services.llamaindex_adapter import embed_texts

HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.+)$")


@dataclass(slots=True)
class ParsedBlock:
    text: str
    page: int
    position: int
    kind: str = "paragraph"
    level: int = 1
    source_location: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class ParsedSection:
    title: str
    level: int
    position: int
    page_start: int
    page_end: int
    blocks: list[ParsedBlock]
    source_location: dict[str, Any] = field(default_factory=dict)

    @property
    def content(self) -> str:
        return "\n\n".join(block.text for block in self.blocks).strip()


def parse_pdf(path: Path) -> tuple[list[ParsedBlock], int]:
    blocks: list[ParsedBlock] = []
    with fitz.open(path) as document:
        position = 0
        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            for raw in page.get_text("blocks", sort=True):
                text = str(raw[4]).strip()
                if not text:
                    continue
                blocks.append(
                    ParsedBlock(
                        text=text,
                        page=page_index + 1,
                        position=position,
                        source_location={
                            "page": page_index + 1,
                            "bbox": [round(float(value), 2) for value in raw[:4]],
                            "block": int(raw[5]),
                        },
                    )
                )
                position += 1
        return blocks, document.page_count


def parse_text(path: Path) -> tuple[list[ParsedBlock], int]:
    content = path.read_text(encoding="utf-8", errors="replace")
    blocks: list[ParsedBlock] = []
    search_start = 0
    for position, raw in enumerate(re.split(r"\n\s*\n", content)):
        text = raw.strip()
        if not text:
            continue
        raw_start = content.find(raw, search_start)
        search_start = max(search_start, raw_start + len(raw))
        match = HEADING_PATTERN.match(text)
        blocks.append(
            ParsedBlock(
                text=match.group(2) if match else text,
                page=1,
                position=position,
                kind="heading" if match else "paragraph",
                level=len(match.group(1)) if match else 1,
                source_location={"line_start": content[:raw_start].count("\n") + 1},
            )
        )
    return blocks, 1


def parse_with_docling(path: Path) -> tuple[list[ParsedBlock], int]:
    try:
        from docling.document_converter import (  # pyright: ignore[reportMissingImports]
            DocumentConverter,
        )
    except ImportError as exc:
        raise RuntimeError("DOCX and PPTX parsing requires the ingestion extra.") from exc

    result = DocumentConverter().convert(path)
    markdown = result.document.export_to_markdown()
    temporary = path.with_suffix(path.suffix + ".normalized.md")
    temporary.write_text(markdown, encoding="utf-8")
    try:
        return parse_text(temporary)
    finally:
        temporary.unlink(missing_ok=True)


def parse_document(path: Path) -> tuple[list[ParsedBlock], int]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return parse_pdf(path)
    if suffix in {".txt", ".md", ".markdown"}:
        return parse_text(path)
    if suffix in {".docx", ".pptx"}:
        return parse_with_docling(path)
    raise RuntimeError(f"Unsupported document format: {suffix}")


def build_sections(blocks: list[ParsedBlock]) -> list[ParsedSection]:
    if not blocks:
        return []

    if not any(block.kind == "heading" for block in blocks):
        pages = sorted({block.page for block in blocks})
        if len(pages) > 1:
            sections: list[ParsedSection] = []
            for page in pages:
                page_blocks = [block for block in blocks if block.page == page]
                sections.append(
                    ParsedSection(
                        title=f"Page {page}",
                        level=1,
                        position=len(sections),
                        page_start=page,
                        page_end=page,
                        blocks=page_blocks,
                        source_location=page_blocks[0].source_location,
                    )
                )
            return sections
        return [
            ParsedSection(
                title=blocks[0].text.splitlines()[0][:180],
                level=1,
                position=0,
                page_start=blocks[0].page,
                page_end=blocks[-1].page,
                blocks=blocks,
                source_location=blocks[0].source_location,
            )
        ]

    sections: list[ParsedSection] = []
    heading: ParsedBlock | None = None
    content_blocks: list[ParsedBlock] = []

    def append_section() -> None:
        nonlocal content_blocks, heading
        if heading is None and not content_blocks:
            return
        first_block = heading or content_blocks[0]
        last_block = content_blocks[-1] if content_blocks else first_block
        sections.append(
            ParsedSection(
                title=heading.text[:500] if heading else "Introduction",
                level=heading.level if heading else 1,
                position=len(sections),
                page_start=first_block.page,
                page_end=last_block.page,
                blocks=content_blocks,
                source_location=first_block.source_location,
            )
        )
        content_blocks = []

    for block in blocks:
        if block.kind == "heading":
            append_section()
            heading = block
        else:
            content_blocks.append(block)
    append_section()
    return sections


def chunk_blocks(blocks: list[ParsedBlock], max_characters: int = 1600) -> list[ParsedBlock]:
    chunks: list[ParsedBlock] = []
    buffer: list[str] = []
    length = 0
    page = 1
    location: dict[str, Any] = {}
    for block in blocks:
        if buffer and length + len(block.text) > max_characters:
            chunks.append(
                ParsedBlock("\n\n".join(buffer), page, len(chunks), source_location=location)
            )
            buffer = []
            length = 0
        if not buffer:
            page = block.page
            location = block.source_location
        buffer.append(block.text)
        length += len(block.text)
    if buffer:
        chunks.append(ParsedBlock("\n\n".join(buffer), page, len(chunks), source_location=location))
    return chunks


async def process_document(document_id: UUID, path: Path) -> None:
    async with async_session_maker() as session:
        document = await session.get(Document, document_id)
        if document is None:
            return
        document.status = DocumentStatus.PROCESSING
        await session.commit()

    try:
        blocks, page_count = await asyncio.to_thread(parse_document, path)
        section_drafts = build_sections(blocks)
        if not section_drafts:
            raise RuntimeError("The document did not contain readable text.")

        section_chunks: list[tuple[int, ParsedBlock]] = []
        for section_index, section in enumerate(section_drafts):
            for chunk in chunk_blocks(section.blocks):
                chunk.position = len(section_chunks)
                section_chunks.append((section_index, chunk))

        embeddings = (
            await embed_texts([chunk.text for _, chunk in section_chunks])
            if settings.rag_mode == "hybrid" and section_chunks
            else [None] * len(section_chunks)
        )

        async with async_session_maker() as session:
            document = await session.get(Document, document_id)
            if document is None:
                return
            await session.execute(
                delete(DocumentSection).where(DocumentSection.document_id == document_id)
            )
            await session.execute(delete(Chunk).where(Chunk.document_id == document_id))

            sections: list[DocumentSection] = []
            for draft in section_drafts:
                section = DocumentSection(
                    document_id=document_id,
                    title=draft.title,
                    level=draft.level,
                    position=draft.position,
                    page_start=draft.page_start,
                    page_end=draft.page_end,
                    content=draft.content,
                    source_location=draft.source_location,
                )
                session.add(section)
                sections.append(section)
            await session.flush()

            level_stack: list[DocumentSection] = []
            for draft, section in zip(section_drafts, sections, strict=True):
                while level_stack and level_stack[-1].level >= draft.level:
                    level_stack.pop()
                section.parent_id = level_stack[-1].id if level_stack else None
                level_stack.append(section)

            for (section_index, chunk), embedding in zip(
                section_chunks, embeddings, strict=True
            ):
                session.add(
                    Chunk(
                        document_id=document_id,
                        section_id=sections[section_index].id,
                        position=chunk.position,
                        text=chunk.text,
                        page=chunk.page,
                        token_count=max(1, len(chunk.text) // 4),
                        source_location=chunk.source_location,
                        embedding=embedding,
                    )
                )

            document.page_count = page_count
            document.status = DocumentStatus.READY
            document.progress = 0
            document.error_message = None
            await session.commit()
    except Exception as exc:
        async with async_session_maker() as session:
            document = await session.scalar(select(Document).where(Document.id == document_id))
            if document:
                document.status = DocumentStatus.FAILED
                document.error_message = str(exc)[:2000]
                await session.commit()
