import re
from uuid import UUID

from sqlalchemy import Select, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import Chunk, DocumentSection
from app.schemas.chat import ChatResponse, CitationResponse
from app.services.llamaindex_adapter import (
    embed_query,
    generate_grounded_answer,
    rerank_passages,
)


def _search_statement(document_id: UUID, question: str, top_k: int) -> Select[tuple[Chunk]]:
    query = func.plainto_tsquery("english", question)
    rank = func.ts_rank_cd(Chunk.search_vector, query)
    return (
        select(Chunk)
        .where(Chunk.document_id == document_id, Chunk.search_vector.op("@@")(query))
        .order_by(desc(rank))
        .limit(top_k)
    )


async def retrieve_grounded_answer(
    session: AsyncSession, document_id: UUID, question: str, top_k: int
) -> ChatResponse:
    keyword_chunks = list(
        (await session.scalars(_search_statement(document_id, question, top_k * 2))).all()
    )
    chunks = keyword_chunks
    if settings.rag_mode == "hybrid":
        query_embedding = await embed_query(question)
        vector_statement = (
            select(Chunk)
            .where(Chunk.document_id == document_id, Chunk.embedding.is_not(None))
            .order_by(Chunk.embedding.op("<=>")(query_embedding))
            .limit(top_k * 2)
        )
        vector_chunks = list((await session.scalars(vector_statement)).all())
        seen: set[UUID] = set()
        candidates = []
        for chunk in [*keyword_chunks, *vector_chunks]:
            if chunk.id not in seen:
                candidates.append(chunk)
                seen.add(chunk.id)
        if candidates:
            ranked_indices = await rerank_passages(
                question,
                [(chunk.text, 1 / (index + 1)) for index, chunk in enumerate(candidates)],
                top_k,
            )
            chunks = [candidates[index] for index in ranked_indices]
    if not chunks:
        terms = [term for term in re.findall(r"[a-zA-Z]{4,}", question.lower())[:5]]
        fallback = select(Chunk).where(Chunk.document_id == document_id)
        if terms:
            fallback = fallback.where(Chunk.text.ilike(f"%{terms[0]}%"))
        chunks = list((await session.scalars(fallback.limit(top_k))).all())

    if not chunks:
        return ChatResponse(
            answer="I could not find enough evidence in this document to answer that question.",
            citations=[],
            grounded=False,
        )

    section_ids = {chunk.section_id for chunk in chunks if chunk.section_id}
    sections = {}
    if section_ids:
        result = await session.scalars(
            select(DocumentSection).where(DocumentSection.id.in_(section_ids))
        )
        sections = {section.id: section for section in result}

    citations: list[CitationResponse] = []
    for chunk in chunks[:4]:
        section = sections.get(chunk.section_id) if chunk.section_id else None
        citations.append(
            CitationResponse(
                id=chunk.id,
                label=section.title if section else "Source passage",
                section_id=chunk.section_id,
                page=chunk.page,
                excerpt=chunk.text[:280].strip(),
                source_location=chunk.source_location,
            )
        )
    evidence = " ".join(chunk.text.strip().replace("\n", " ") for chunk in chunks[:2])
    answer = (
        await generate_grounded_answer(question, [chunk.text for chunk in chunks[:4]])
        if settings.rag_mode == "hybrid"
        else evidence[:900].rsplit(" ", 1)[0]
    )
    return ChatResponse(answer=answer, citations=citations, grounded=True)
