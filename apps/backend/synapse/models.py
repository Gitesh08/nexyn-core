from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class IngestPayload(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class NormalizedPayload(BaseModel):
    text: str
    timestamp: float
    content_hash: str

class ValenceResult(BaseModel):
    score: int
    reasoning: str
    text: str | None = None

class MemoryTrace(BaseModel):
    node_id: str
    text: str
    dataset: str
    valence_score: int
    weight_initial: float
    decay_rate: float
    last_accessed: datetime
    created_at: datetime
    reason: str = ""
    status: str = "active"  # 'active', 'pending_prune', 'pruned'

class RecallRequest(BaseModel):
    query: str
    top_k: int = 5
    dataset: Optional[str] = "general"
    min_weight: Optional[float] = None

class RecallMatch(BaseModel):
    node_id: str
    text: str
    current_weight: float
    valence_score: int
    semantic_similarity: float
    composite_score: float

class RecallResult(BaseModel):
    matches: List[RecallMatch]
    error: Optional[str] = None
    is_timeout: bool = False
