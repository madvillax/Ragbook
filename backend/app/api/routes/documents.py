import hashlib
import re
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document
from app.schemas.document import (
    DocumentDetail,
    DocumentSummary,
    DocumentUploadResponse,
    SectionResponse,
)
from app.services.ingestion import process_document

router = APIRouter(prefix="/documents", tags=["documents"])
ALLOWED_SUFFIXES = {".pdf", ".docx", ".pptx", ".txt", ".md", ".markdown"}


def clean_title(filename: str) -> str:
    title = re.sub(r"[_-]+", " ", Path(filename).stem).strip()
    return title[:500] or "Untitled document"


@router.get("", response_model=list[DocumentSummary], response_model_by_alias=True)
async def list_documents(session: AsyncSession = Depends(get_db)) -> list[DocumentSummary]:
    result = await session.scalars(select(Document).order_by(Document.updated_at.desc()))
    return [DocumentSummary.from_document(document) for document in result]


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: UUID, session: AsyncSession = Depends(get_db)
) -> DocumentDetail:
    statement = (
        select(Document).where(Document.id == document_id).options(selectinload(Document.sections))
    )
    document = await session.scalar(statement)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    document_status = (
        "processing"
        if document.status.value in {"uploaded", "processing"}
        else document.status.value
    )
    return DocumentDetail(
        id=document.id,
        title=document.title,
        author=document.author,
        format=document.format,
        status=document_status,
        progress=round(document.progress),
        page_count=document.page_count,
        created_at=document.created_at,
        error_message=document.error_message,
        sections=[
            SectionResponse(
                id=section.id,
                title=section.title,
                level=section.level,
                position=section.position,
                page_start=section.page_start,
                page_end=section.page_end,
                content=section.content,
                source_location=section.source_location,
            )
            for section in document.sections
        ],
    )


@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    filename = Path(file.filename or "document").name
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Unsupported file type.")

    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    document_id = uuid4()
    storage_path = settings.uploads_dir / f"{document_id}{suffix}"
    digest = hashlib.sha256()
    size = 0
    with storage_path.open("wb") as destination:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.max_upload_bytes:
                destination.close()
                storage_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File exceeds the 100 MB limit.")
            digest.update(chunk)
            destination.write(chunk)

    document = Document(
        id=document_id,
        title=clean_title(filename),
        author="Unknown author",
        filename=filename,
        media_type=file.content_type or "application/octet-stream",
        format=suffix.removeprefix(".").upper(),
        storage_path=str(storage_path),
        checksum=digest.hexdigest(),
    )
    session.add(document)
    await session.commit()
    background_tasks.add_task(process_document, document.id, storage_path)
    return DocumentUploadResponse(id=document.id, status="processing")
