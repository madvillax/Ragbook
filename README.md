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

RAGBOOK uses PostgreSQL with the pgvector extension. PostgreSQL does not use an API key. The backend connects with `DATABASE_URL`, which contains the database username, password, host, port, and database name.

Install and start Docker Desktop, then start PostgreSQL and the API:

```bash
docker compose up -d postgres
cp .env.example .env
cd backend
uv sync --dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The local database uses:

```dotenv
DATABASE_URL=postgresql+asyncpg://ragbook:ragbook@localhost:5432/ragbook
```

Useful database commands:

```bash
docker compose ps
docker compose logs -f postgres
docker compose stop postgres
docker compose exec postgres psql -U ragbook -d ragbook
```

The `ragbook-postgres-data` Docker volume preserves database data when the container is stopped or recreated. The password in `.env.example` is intended only for local development; use a strong secret-managed password for production.

For DOCX, PPTX, LlamaIndex, and Gemini adapters:

```bash
uv sync --dev --extra ingestion --extra rag
```

Set `VITE_API_URL=http://localhost:8000` to connect the frontend to the API. To enable the complete embedding, reranking, and LLM path, set `RAG_MODE=hybrid`, add a server-side `GEMINI_API_KEY`, and install the `rag` extra. Create the Gemini key in [Google AI Studio](https://aistudio.google.com/app/apikey); PostgreSQL itself does not need an API key. The default `fts` mode remains deterministic and requires no external AI provider.

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
