import asyncio
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import UUID

import fitz
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
    for position, raw in enumerate(re.split(r"\n\s*\n", content)):
        text = raw.strip()
        if not text:
            continue
        match = HEADING_PATTERN.match(text)
        blocks.append(
            ParsedBlock(
                text=match.group(2) if match else text,
                page=1,
                position=position,
                kind="heading" if match else "paragraph",
                level=len(match.group(1)) if match else 1,
                source_location={"line_start": content[: content.find(raw)].count("\n") + 1},
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
    if suffix == ".epub":
        raise RuntimeError("EPUB ingestion is planned but not enabled yet.")
    raise RuntimeError(f"Unsupported document format: {suffix}")


def build_sections(blocks: list[ParsedBlock]) -> list[ParsedBlock]:
    headings = [block for block in blocks if block.kind == "heading"]
    if headings:
        return headings
    title = blocks[0].text.splitlines()[0][:180] if blocks else "Document"
    return [ParsedBlock(text=title, page=1, position=0, kind="heading")]


def chunk_blocks(blocks: list[ParsedBlock], max_characters: int = 1600) -> list[ParsedBlock]:
    chunks: list[ParsedBlock] = []
    buffer: list[str] = []
    length = 0
    page = 1
    location: dict[str, Any] = {}
    for block in blocks:
        if block.kind == "heading":
            continue
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
        section_blocks = build_sections(blocks)
        chunks = chunk_blocks(blocks)
        embeddings = (
            await embed_texts([chunk.text for chunk in chunks])
            if settings.rag_mode == "hybrid" and chunks
            else [None] * len(chunks)
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
            for block in section_blocks:
                section = DocumentSection(
                    document_id=document_id,
                    title=block.text[:500],
                    level=block.level,
                    position=block.position,
                    page_start=block.page,
                    page_end=block.page,
                    content="",
                    source_location=block.source_location,
                )
                session.add(section)
                sections.append(section)
            await session.flush()

            default_section_id = sections[0].id if sections else None
            for chunk, embedding in zip(chunks, embeddings, strict=True):
                session.add(
                    Chunk(
                        document_id=document_id,
                        section_id=default_section_id,
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
