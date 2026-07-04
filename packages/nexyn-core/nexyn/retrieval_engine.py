"""
Retrieval Engine — 2-tier hybrid, deployment-safe.

Tier 1: Cognee CHUNKS search
  Works immediately after remember(), no cognify() needed.
  Returns results with embedded __nexyn__ metadata tag that holds
  valence/weight/node_id — so we can score without SQLite.

Tier 2: Local SQLite BM25 fallback
  Only used when Cognee returns 0 results (e.g. Cognee is down or dataset empty).
  SQLite persists within a single Render deployment session.

Both tiers produce RecallMatch with accurate composite scores.
"""
import logging
import asyncio
import math
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Tuple, Optional

from .models import RecallRequest, RecallResult, RecallMatch, MemoryTrace
from .registry import WeightRegistry
from .decay import calculate_current_weight
from .config import settings
from . import cognee_client

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# BM25-lite local scorer (Tier 2 only)
# ---------------------------------------------------------------------------

_STOP = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "of", "in", "on", "at",
    "to", "for", "with", "and", "or", "not", "this", "that", "it", "its",
    "be", "do", "have", "i", "you", "he", "she", "we", "they", "what",
    "which", "who", "how", "when", "where", "why",
})

def _tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"\w+", text.lower()) if t not in _STOP]

def _bm25(query: str, document: str, k1: float = 1.5, b: float = 0.75) -> float:
    q_tokens = set(_tokenize(query))
    d_tokens = _tokenize(document)
    if not q_tokens or not d_tokens:
        return 0.0
    dl = len(d_tokens)
    avgdl = 20.0
    tf_map: dict[str, int] = {}
    for t in d_tokens:
        tf_map[t] = tf_map.get(t, 0) + 1
    score = 0.0
    for term in q_tokens:
        if term in tf_map:
            f = tf_map[term]
            idf = math.log(2.0)  # simplified constant IDF
            score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl))
    max_possible = len(q_tokens) * math.log(2.0) * (k1 + 1)
    return min(score / max_possible, 1.0) if max_possible else 0.0

def _overlap(query: str, doc: str) -> float:
    q = set(_tokenize(query))
    d = set(_tokenize(doc))
    return len(q & d) / len(q) if q else 0.0


# ---------------------------------------------------------------------------
# Score helpers
# ---------------------------------------------------------------------------

def _composite(semantic: float, valence: int, weight: float) -> float:
    """Blend semantic similarity, memory importance, and decay weight."""
    valence_factor = min((valence - 1) / 4.0, 1.0)  # 1-5 → 0-1
    weight_factor = min(weight / 100.0, 1.0)
    return (semantic * 0.50) + (valence_factor * 0.30) + (weight_factor * 0.20)

def _current_weight(trace: MemoryTrace, now: datetime) -> float:
    elapsed = max(0.0, (now - trace.last_accessed).total_seconds() / 86400.0)
    return calculate_current_weight(trace.weight_initial, trace.decay_rate, elapsed)


# ---------------------------------------------------------------------------
# Main engine
# ---------------------------------------------------------------------------

class RetrievalEngine:
    def __init__(self, registry: WeightRegistry):
        self.registry = registry
        self._cache: Dict[str, Tuple[RecallResult, datetime]] = {}

    def _cache_key(self, req: RecallRequest, tenant_id: str, user_id: str) -> str:
        return f"{tenant_id}:{user_id}:{req.query}:{req.dataset}:{req.top_k}:{req.min_weight}"

    # ------------------------------------------------------------------
    # Tier 1: Cognee CHUNKS (primary — works without cognify)
    # ------------------------------------------------------------------

    async def _cognee_tier(
        self,
        query: str,
        tenant_id: str,
        user_id: str,
        cognee_key: str,
        cognee_url: Optional[str],
        dataset_name: str,
        top_k: int,
        min_weight: Optional[float],
        now: datetime,
    ) -> List[RecallMatch]:
        try:
            raw = await asyncio.wait_for(
                cognee_client.search_chunks(
                    query, cognee_key, cognee_url=cognee_url,
                    dataset=dataset_name, top_k=top_k * 3,
                ),
                timeout=20.0,
            )
        except asyncio.TimeoutError:
            logger.warning("Cognee CHUNKS timed out")
            return []
        except Exception as e:
            logger.warning(f"Cognee CHUNKS error: {e}")
            return []

        if not raw:
            logger.info("Cognee CHUNKS returned 0 results")
            return []

        matches: List[RecallMatch] = []
        for rank, entry in enumerate(raw):
            text = (entry.get("text") or "").strip()
            if not text:
                continue

            # --- Recover metadata embedded in stored text ---
            nexyn_meta = entry.get("nexyn_meta", {})
            valence = int(nexyn_meta.get("valence", 3))
            w_initial = float(nexyn_meta.get("w_initial", 50.0))
            decay = float(nexyn_meta.get("decay_rate", 2.0))
            node_id_from_meta = nexyn_meta.get("node_id", "")
            meta_tenant = nexyn_meta.get("tenant_id")
            meta_user = nexyn_meta.get("user_id")

            if meta_tenant and meta_user and (meta_tenant != tenant_id or meta_user != user_id):
                continue

            # --- Try to enrich from local registry (bonus, not required) ---
            trace = None
            if node_id_from_meta:
                trace = await self.registry.get(node_id_from_meta)
            if not trace:
                trace = await self.registry.get_by_text(text)

            if trace:
                if trace.status in ("pruned", "pending_prune", "failed", "dropped"):
                    continue
                node_id = trace.node_id
                valence = trace.valence_score
                w_current = _current_weight(trace, now)
            else:
                # Build a synthetic weight from stored metadata
                node_id = node_id_from_meta or entry.get("raw", {}).get("id") or text[:64]
                elapsed = 0.0  # fresh — no SQLite record means just ingested
                w_current = calculate_current_weight(w_initial, decay, elapsed)

            if min_weight is not None and w_current < min_weight:
                continue

            # --- Semantic score from Cognee + local overlap boost ---
            raw_score = float(entry.get("score") or 0.0)
            bm25 = _bm25(query, text)
                        
            # Cognee/LanceDB returns distance (0 = perfect match, higher = worse).
            # If Cognee omits the score (raw_score == 0.0), synthesize it from the rank, 
            # because if it was returned by Tier 1, it is a valid semantic vector match!
            if raw_score > 0:
                cognee_sim = max(0.0, 1.0 - raw_score)
            else:
                # Synthesize high score based on nearest-neighbor rank (85% for top result)
                cognee_sim = max(0.85 - (rank * 0.05), 0.50)
            
            # If Cognee gave a meaningful similarity, use it; otherwise rely on BM25
            semantic = max(cognee_sim, bm25 * 0.8) if cognee_sim > 0.05 else bm25

            composite = _composite(semantic, valence, w_current)

            matches.append(RecallMatch(
                node_id=str(node_id),
                text=text,
                current_weight=w_current,
                valence_score=valence,
                semantic_similarity=round(semantic, 4),
                composite_score=round(composite, 4),
            ))

        matches.sort(key=lambda m: m.composite_score, reverse=True)
        return matches[:top_k]

    # ------------------------------------------------------------------
    # Tier 2: Local SQLite BM25 (fallback — zero external deps)
    # ------------------------------------------------------------------

    async def _local_tier(
        self,
        query: str,
        tenant_id: str,
        user_id: str,
        top_k: int,
        min_weight: Optional[float],
        now: datetime,
        exclude: set,
    ) -> List[RecallMatch]:
        all_traces = await self.registry.list_active(tenant_id, user_id, batch_size=500)
        scored: List[RecallMatch] = []

        for trace in all_traces:
            if trace.node_id in exclude:
                continue
            if trace.status in ("pruned", "pending_prune", "failed", "dropped"):
                continue
            if not trace.text or not trace.text.strip():
                continue

            bm25 = _bm25(query, trace.text)
            ov = _overlap(query, trace.text)
            semantic = bm25 * 0.7 + ov * 0.3
            if semantic < 0.05:
                continue

            w_current = _current_weight(trace, now)
            if min_weight is not None and w_current < min_weight:
                continue

            composite = _composite(semantic, trace.valence_score, w_current)

            scored.append(RecallMatch(
                node_id=trace.node_id,
                text=trace.text,
                current_weight=w_current,
                valence_score=trace.valence_score,
                semantic_similarity=round(semantic, 4),
                composite_score=round(composite, 4),
            ))

        scored.sort(key=lambda m: m.composite_score, reverse=True)
        return scored[:top_k]

    # ------------------------------------------------------------------
    # Public recall()
    # ------------------------------------------------------------------

    async def recall(
        self,
        request: RecallRequest,
        tenant_id: str,
        user_id: str,
        nim_key: str,
        cognee_key: str,
        cognee_url: str = None,
    ) -> RecallResult:
        from nexyn.remote_logger import log_remote
        await log_remote(
            category="LAYER_4_RETRIEVE",
            level="INFO",
            message=f"Retrieval requested for query: '{request.query}'",
            tenant_id=tenant_id,
            user_id=user_id
        )

        cache_key = self._cache_key(request, tenant_id, user_id)
        now = datetime.now(timezone.utc)

        if cache_key in self._cache:
            cached, expires_at = self._cache[cache_key]
            if now < expires_at:
                await log_remote(
                    category="LAYER_4_RETRIEVE",
                    level="INFO",
                    message="Retrieval served from cache.",
                    tenant_id=tenant_id,
                    user_id=user_id
                )
                return cached
            del self._cache[cache_key]

        dataset_name = f"{tenant_id}_{user_id}_{request.dataset or 'general'}"
        top_k = request.top_k or 5

        # Tier 1
        try:
            cognee_matches = await asyncio.wait_for(
                self._cognee_tier(
                    request.query, tenant_id, user_id, cognee_key, cognee_url,
                    dataset_name, top_k, request.min_weight, now
                ),
                timeout=settings.retrieval_timeout_seconds
            )
        except asyncio.TimeoutError:
            logger.warning(f"Recall timed out after {settings.retrieval_timeout_seconds}s for query: {request.query}")
            return RecallResult(matches=[], error="timeout", is_timeout=True)
        logger.info(f"Tier 1 (Cognee CHUNKS): {len(cognee_matches)} matches")

        # Tier 2 only if Tier 1 returned nothing
        final_matches = cognee_matches
        if not cognee_matches:
            logger.info("Tier 1 empty — falling back to local BM25")
            local_matches = await self._local_tier(
                request.query, tenant_id, user_id,
                top_k, request.min_weight, now, set()
            )
            logger.info(f"Tier 2 (local BM25): {len(local_matches)} matches")
            final_matches = local_matches

        result = RecallResult(matches=final_matches)

        ttl = settings.retrieval_cache_ttl_seconds
        self._cache[cache_key] = (result, now + timedelta(seconds=ttl))

        if settings.reinforce_on_recall:
            for m in final_matches:
                await self.reinforce(m.node_id)

        await log_remote(
            category="LAYER_4_RETRIEVE",
            level="INFO",
            message=f"Recalled {len(final_matches)} matches",
            tenant_id=tenant_id,
            user_id=user_id,
            details={
                "query": request.query,
                "matches": [{"text": m.text[:50], "score": m.composite_score} for m in final_matches]
            }
        )

        return result

    async def reinforce(self, node_id: str) -> None:
        trace = await self.registry.get(node_id)
        if not trace or trace.status in ("pruned", "pending_prune"):
            return
        await self.registry.touch_last_accessed(node_id)
