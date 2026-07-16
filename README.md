# Cardex

A FastAPI service that performs semantic search over a small dataset of ML/AI
research paper abstracts, using sentence embeddings + a vector database
instead of keyword matching.

Named after the card-index cabinets libraries once used to browse their
collections — this is that idea rebuilt with vector search: you search by
meaning instead of flipping through cards for exact title matches.

Unlike keyword search, this returns relevant papers even when the query
wording doesn't match the abstract wording — e.g. searching "reducing GPU
memory during LLM training" will surface the LoRA fine-tuning paper even
though it never uses those exact words.

## Stack

- **FastAPI** — REST API
- **sentence-transformers** (`all-MiniLM-L6-v2`) — turns text into 384-dim embeddings
- **Qdrant** (in-memory mode) — vector similarity search
- **Pydantic** — request/response validation

## Project structure

```
semantic-paper-search/
├── app/
│   ├── main.py           # FastAPI app + endpoints
│   ├── embeddings.py      # sentence-transformers wrapper
│   ├── vector_store.py    # Qdrant client wrapper
│   └── schemas.py         # Pydantic models
├── frontend/               # React + TypeScript + Vite search UI
├── data/
│   └── papers.json        # sample dataset (30 synthetic abstracts)
├── requirements.txt
└── README.md
```

## Setup (Windows PowerShell)

```powershell
cd semantic-paper-search
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload
```

First startup will download the embedding model (~80MB) and build the
in-memory vector index from `data/papers.json`. Then open
http://127.0.0.1:8000/docs for interactive Swagger UI.

## Example request

```powershell
curl -X POST http://127.0.0.1:8000/search `
  -H "Content-Type: application/json" `
  -d '{\"query\": \"reducing memory usage when training large models\", \"top_k\": 3}'
```

Response:
```json
{
  "query": "reducing memory usage when training large models",
  "results": [
    { "id": 1, "title": "Efficient Fine-Tuning of Large Language Models with Low-Rank Adapters", "score": 0.71, ... },
    { "id": 14, "title": "Knowledge Distillation for Deploying Compact Language Models", "score": 0.52, ... },
    { "id": 29, "title": "Energy-Efficient Training of Deep Learning Models", "score": 0.48, ... }
  ]
}
```

## Frontend (React + TypeScript + Vite)

A minimal search UI lives in `frontend/`. It calls the FastAPI backend at
`http://127.0.0.1:8000`, so keep the backend running in one terminal and run
the frontend in a second terminal.

```powershell
cd frontend
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`). Type a query
or click one of the sample queries to see semantic matches with a relevance
meter per result.

If you get a CORS error in the browser console, double check the backend is
running — CORS is already enabled in `app/main.py` (`allow_origins=["*"]`),
so this is almost always "backend isn't running" rather than a real CORS
issue.

## Extending this project (optional, if you have extra time)

- Swap the in-memory Qdrant client for Qdrant Cloud (same setup as TalentSpark) for persistence
- Replace `papers.json` with a real dataset (e.g. arXiv abstracts via their public API)
- Add a `/papers/{id}/similar` endpoint for "more like this"
- Add a minimal React search UI (reuse patterns from TalentSpark's frontend)
- Add hybrid search: combine BM25 keyword score with vector score

## Resume line

> Built Cardex, a semantic search engine over research paper abstracts using
> sentence-transformer embeddings and Qdrant vector search, exposed via a
> FastAPI REST API with a React frontend and sub-second query latency.
