import asyncio
from importlib import import_module
from typing import Any

from app.core.config import settings


class AIAdapterConfigurationError(RuntimeError):
    """Raised when hybrid RAG is enabled without its optional runtime."""


def _api_key() -> str:
    if settings.gemini_api_key is None:
        raise AIAdapterConfigurationError(
            "Hybrid RAG requires GEMINI_API_KEY and the backend rag extra."
        )
    return settings.gemini_api_key.get_secret_value()


def _load(name: str, attribute: str) -> Any:
    try:
        return getattr(import_module(name), attribute)
    except (ImportError, AttributeError) as exc:
        raise AIAdapterConfigurationError(
            "Install the LlamaIndex runtime with `uv sync --extra rag`."
        ) from exc


def _embedding_client() -> Any:
    embedding_class = _load("llama_index.embeddings.google_genai", "GoogleGenAIEmbedding")
    embedding_config = _load("google.genai.types", "EmbedContentConfig")
    return embedding_class(
        model_name=settings.embedding_model,
        api_key=_api_key(),
        embedding_config=embedding_config(
            output_dimensionality=settings.embedding_dimensions,
        ),
    )


def _llm_client() -> Any:
    llm_class = _load("llama_index.llms.google_genai", "GoogleGenAI")
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
    def rerank() -> list[Any]:
        reranker = llm_rerank(
            choice_batch_size=min(10, max(1, len(nodes))),
            top_n=top_n,
            llm=_llm_client(),
        )
        return reranker.postprocess_nodes(nodes, query_str=question)

    ranked = await asyncio.to_thread(rerank)
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
    def complete() -> Any:
        return _llm_client().complete(prompt)

    response = await asyncio.to_thread(complete)
    return str(response).strip()
