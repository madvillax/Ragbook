import asyncio
from importlib import import_module
from typing import Any

from app.core.config import settings


class AIAdapterConfigurationError(RuntimeError):
    """Raised when hybrid RAG is enabled without its optional runtime."""


def _api_key() -> str:
    if settings.openai_api_key is None:
        raise AIAdapterConfigurationError(
            "Hybrid RAG requires OPENAI_API_KEY and the backend rag extra."
        )
    return settings.openai_api_key.get_secret_value()


def _load(name: str, attribute: str) -> Any:
    try:
        return getattr(import_module(name), attribute)
    except (ImportError, AttributeError) as exc:
        raise AIAdapterConfigurationError(
            "Install the LlamaIndex runtime with `uv sync --extra rag`."
        ) from exc


def _embedding_client() -> Any:
    embedding_class = _load("llama_index.embeddings.openai", "OpenAIEmbedding")
    return embedding_class(model=settings.embedding_model, api_key=_api_key())


def _llm_client() -> Any:
    llm_class = _load("llama_index.llms.openai", "OpenAI")
    return llm_class(model=settings.llm_model, api_key=_api_key(), temperature=0)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    client = _embedding_client()
    return await asyncio.to_thread(client.get_text_embedding_batch, texts)


async def embed_query(question: str) -> list[float]:
    client = _embedding_client()
    return await asyncio.to_thread(client.get_query_embedding, question)


async def rerank_passages(
    question: str, passages: list[tuple[str, float]], top_n: int
) -> list[int]:
    text_node = _load("llama_index.core.schema", "TextNode")
    node_with_score = _load("llama_index.core.schema", "NodeWithScore")
    llm_rerank = _load("llama_index.core.postprocessor", "LLMRerank")
    nodes = [
        node_with_score(node=text_node(text=text, metadata={"candidate_index": index}), score=score)
        for index, (text, score) in enumerate(passages)
    ]
    reranker = llm_rerank(
        choice_batch_size=min(10, max(1, len(nodes))),
        top_n=top_n,
        llm=_llm_client(),
    )
    ranked = await asyncio.to_thread(reranker.postprocess_nodes, nodes, query_str=question)
    return [int(item.node.metadata["candidate_index"]) for item in ranked]


async def generate_grounded_answer(question: str, evidence: list[str]) -> str:
    numbered_evidence = "\n\n".join(
        f"SOURCE {index + 1}:\n{text}" for index, text in enumerate(evidence)
    )
    prompt = f"""You answer questions about one uploaded document.
Use only the source passages below. If the evidence is insufficient, say so.
Do not invent citations because the application attaches citations separately.

QUESTION:
{question}

SOURCE PASSAGES:
{numbered_evidence}

ANSWER:"""
    response = await asyncio.to_thread(_llm_client().complete, prompt)
    return str(response).strip()
