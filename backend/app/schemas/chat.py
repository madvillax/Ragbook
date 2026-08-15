from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    document_id: UUID
    question: str = Field(min_length=2, max_length=2000)
    top_k: int = Field(default=6, ge=1, le=20)


class CitationResponse(BaseModel):
    id: UUID
    label: str
    section_id: UUID | None
    page: int
    excerpt: str
    source_location: dict[str, object]


class ChatResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]
    grounded: bool
