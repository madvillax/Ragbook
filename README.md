# RAGBOOK

RAGBOOK converts source documents into a structured, ebook-style reader and keeps every AI answer connected to its supporting passage.

## What is included

- React 19, TypeScript, Vite, TanStack Router, TanStack Query, Zustand, Tailwind CSS 4, Base UI, and Motion
- A responsive document library with search, filtering, upload, processing, empty, loading, and error states
- A focused reader with an outline, typography controls, grounded chat, source citations, and exact passage jumps
- FastAPI, Pydantic, async SQLAlchemy, Alembic, PostgreSQL full-text search, and pgvector-ready storage
- PyMuPDF parsing for PDF and native text parsing for TXT and Markdown
- Optional Docling adapters for DOCX and PPTX
- A feature-flagged LlamaIndex pipeline for Gemini embeddings, pgvector retrieval, LLM reranking, grounded generation, and stable source citations
- Ruff, Pyright, Oxc oxlint, TypeScript, and pytest tooling

## Start the web app

```bash
pnpm install
pnpm dev
```

The frontend uses high-fidelity sample documents when `VITE_API_URL` is not set. This keeps product development independent from local infrastructure.

## Start the API

```bash
docker compose up -d postgres
cd backend
uv sync --dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

For DOCX, PPTX, LlamaIndex, and Gemini adapters:

```bash
uv sync --dev --extra ingestion --extra rag
```

Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:8000` to connect the frontend to the API.
Set `RAG_MODE=hybrid`, provide `GEMINI_API_KEY`, and install the `rag` extra to enable the full embedding, reranking, and LLM path. The default `fts` mode remains deterministic and requires no external AI provider.

## Architecture

```text
Document upload
  -> immutable source file
  -> parser and normalizer
  -> sections plus source coordinates
  -> hybrid FTS and vector chunks
  -> retrieval and reranking
  -> grounded answer plus citations
  -> exact passage jump in the reader
```

The database stores normalized sections separately from retrieval chunks. This prevents chunking decisions from becoming the rendering model and keeps citations stable when retrieval settings change.
