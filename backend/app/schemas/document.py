from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.document import Document, DocumentStatus


class DocumentSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    author: str
    format: str
    progress: int
    status: str
    updated_at: datetime = Field(serialization_alias="updatedAt")
    page_count: int = Field(serialization_alias="pageCount")
    cover: str
    category: str
    error_message: str | None = Field(serialization_alias="errorMessage")

    @classmethod
    def from_document(cls, document: Document) -> "DocumentSummary":
        status = (
            "processing"
            if document.status in {DocumentStatus.UPLOADED, DocumentStatus.PROCESSING}
            else document.status.value
        )
        return cls(
            id=str(document.id),
            title=document.title,
            author=document.author,
            format=document.format,
            progress=round(document.progress),
            status=status,
            updated_at=document.updated_at,
            page_count=document.page_count,
            cover=(document.metadata_json or {}).get("cover", "cobalt"),
            category=document.category,
            error_message=document.error_message,
        )


class DocumentUploadResponse(BaseModel):
    id: UUID
    status: str


class SectionResponse(BaseModel):
    id: UUID
    title: str
    level: int
    position: int
    page_start: int
    page_end: int
    content: str
    source_location: dict[str, object]


class DocumentDetail(BaseModel):
    id: UUID
    title: str
    author: str
    format: str
    status: str
    progress: int
    page_count: int
    created_at: datetime
    error_message: str | None
    sections: list[SectionResponse]
