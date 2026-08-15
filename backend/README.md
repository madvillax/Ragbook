# RAGBOOK API

FastAPI service for uploads, document normalization, PostgreSQL full-text search, vector retrieval, and citation-grounded answers.

Install the core API with `uv sync --dev`. Install heavyweight document and AI adapters with `uv sync --dev --extra ingestion --extra rag`.

Start the local pgvector-enabled PostgreSQL container from the repository root with `docker compose up -d postgres`. The API reads its PostgreSQL connection from `DATABASE_URL`; no PostgreSQL API key is required.
