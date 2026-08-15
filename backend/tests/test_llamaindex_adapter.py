from typing import Any

from pydantic import SecretStr

from app.services import llamaindex_adapter


class FakeClient:
    def __init__(self, **kwargs: Any) -> None:
        self.kwargs = kwargs


def test_gemini_clients_receive_configured_key_and_models(monkeypatch: Any) -> None:
    monkeypatch.setattr(llamaindex_adapter.settings, "gemini_api_key", SecretStr("test-key"))

    integrations: dict[tuple[str, str], Any] = {
        (
            "llama_index.embeddings.google_genai",
            "GoogleGenAIEmbedding",
        ): FakeClient,
        ("google.genai.types", "EmbedContentConfig"): FakeClient,
        ("llama_index.llms.google_genai", "GoogleGenAI"): FakeClient,
    }
    monkeypatch.setattr(
        llamaindex_adapter,
        "_load",
        lambda module, attribute: integrations[(module, attribute)],
    )

    embedding = llamaindex_adapter._embedding_client()
    llm = llamaindex_adapter._llm_client()

    assert embedding.kwargs["model_name"] == "gemini-embedding-001"
    assert embedding.kwargs["api_key"] == "test-key"
    assert embedding.kwargs["embedding_config"].kwargs["output_dimensionality"] == 1536
    assert llm.kwargs == {
        "model": "gemini-2.5-flash",
        "api_key": "test-key",
        "temperature": 0,
    }
