from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict, Any

COLLECTION_NAME = "papers"
VECTOR_SIZE = 384  # matches all-MiniLM-L6-v2 output dimension

# ":memory:" runs Qdrant fully in-process — perfect for a quick portfolio build.
# Swap this for a QdrantClient(url=..., api_key=...) pointing at Qdrant Cloud
# (same as your TalentSpark setup) if you want persistence later.
client = QdrantClient(":memory:")


def init_collection() -> None:
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def upsert_papers(papers: List[Dict[str, Any]], vectors) -> None:
    points = [
        PointStruct(
            id=paper["id"],
            vector=vector.tolist(),
            payload=paper,
        )
        for paper, vector in zip(papers, vectors)
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)


def search(query_vector: List[float], top_k: int = 5):
    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k,
    )


def collection_size() -> int:
    info = client.get_collection(COLLECTION_NAME)
    return info.points_count
