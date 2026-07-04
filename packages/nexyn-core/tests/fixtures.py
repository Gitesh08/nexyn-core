import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

@dataclass
class MockMemoryTrace:
    node_id: str
    tenant_id: str
    user_id: str
    text: str
    dataset: str
    valence_score: int
    weight_initial: float
    decay_rate: float
    last_accessed: datetime
    created_at: datetime
    reason: str = ""
    status: str = "active"

_SCORE_TABLE = {
    2: (20.0, 10.0),
    3: (50.0, 3.5),
    4: (100.0, 1.0),
    5: (float("inf"), 0.0),
}

def make_trace(text: str, score: int, hours_ago: int = 0, dataset: str = "general") -> MockMemoryTrace:
    if score not in _SCORE_TABLE:
        raise ValueError(f"score must be 2-5 (1 is dropped before persistence), got {score}")
    w_initial, lam = _SCORE_TABLE[score]
    now = datetime.now(timezone.utc)
    stamped = now - timedelta(hours=hours_ago)
    return MockMemoryTrace(
        node_id=str(uuid.uuid4()),
        tenant_id="mock_tenant",
        user_id="mock_user",
        text=text,
        dataset=dataset,
        valence_score=score,
        weight_initial=w_initial,
        decay_rate=lam,
        last_accessed=stamped,
        created_at=stamped,
        reason=f"mock trace, score {score}",
    )

def seed_sample_memories() -> list[MockMemoryTrace]:
    """A believable mixed batch: some fresh, some stale, one core rule."""
    return [
        make_trace("User prefers dark mode in the dashboard.", score=2, hours_ago=48),
        make_trace("The project's primary DB is PostgreSQL 15.", score=3, hours_ago=6),
        make_trace("User's employer is migrating off Heroku in Q3.", score=4, hours_ago=1),
        make_trace("Never expose the internal admin API without auth.", score=5, hours_ago=200),
        make_trace("User clicked 'export' three times in a row.", score=2, hours_ago=72),  # should be near/past prune floor
    ]
