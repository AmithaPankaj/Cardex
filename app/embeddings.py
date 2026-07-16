from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

# Small, fast model — good balance of quality and speed for a portfolio project.
# Downloads automatically from Hugging Face on first run (~80MB).
MODEL_NAME = "all-MiniLM-L6-v2"

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Lazily load the embedding model so app startup doesn't stall on import."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: List[str]) -> np.ndarray:
    model = get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(embeddings)


def embed_query(text: str) -> List[float]:
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return embedding.tolist()
