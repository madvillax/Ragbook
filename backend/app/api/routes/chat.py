from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.retrieval import retrieve_grounded_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, session: AsyncSession = Depends(get_db)) -> ChatResponse:
    if await session.get(Document, request.document_id) is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return await retrieve_grounded_answer(
        session=session,
        document_id=request.document_id,
        question=request.question,
        top_k=request.top_k,
    )
