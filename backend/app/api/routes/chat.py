from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.document import Document, DocumentStatus
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.retrieval import retrieve_grounded_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, session: AsyncSession = Depends(get_db)) -> ChatResponse:
    document = await session.get(Document, request.document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status != DocumentStatus.READY:
        raise HTTPException(status_code=409, detail="Document is not ready for questions yet.")
    return await retrieve_grounded_answer(
        session=session,
        document_id=request.document_id,
        question=request.question,
        top_k=request.top_k,
    )
