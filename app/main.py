import json
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.embeddings import embed_texts, embed_query
from app.vector_store import init_collection, upsert_papers, search, collection_size
from app.schemas import Paper, SearchRequest, SearchResponse, SearchResult

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "papers.json"


def load_papers() -> list[dict]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Build the vector index once at startup.
    papers = load_papers()
    init_collection()
    texts = [f"{p['title']}. {p['abstract']}" for p in papers]
    vectors = embed_texts(texts)
    upsert_papers(papers, vectors)
    print(f"Indexed {collection_size()} papers into the vector store.")
    yield


app = FastAPI(
    title="Cardex",
    description="Cardex — semantic search over ML/AI research paper abstracts using sentence embeddings + Qdrant.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Cardex API — semantic paper search. See /docs for usage."}


@app.get("/papers", response_model=list[Paper])
def list_papers():
    return load_papers()


@app.post("/search", response_model=SearchResponse)
def search_papers(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    query_vector = embed_query(request.query)
    hits = search(query_vector, top_k=request.top_k)

    results = [
        SearchResult(
            id=hit.payload["id"],
            title=hit.payload["title"],
            abstract=hit.payload["abstract"],
            category=hit.payload["category"],
            year=hit.payload["year"],
            score=round(hit.score, 4),
        )
        for hit in hits
    ]

    return SearchResponse(query=request.query, results=results)
