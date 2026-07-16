from pydantic import BaseModel
from typing import List


class Paper(BaseModel):
    id: int
    title: str
    abstract: str
    category: str
    year: int


class SearchResult(BaseModel):
    id: int
    title: str
    abstract: str
    category: str
    year: int
    score: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
