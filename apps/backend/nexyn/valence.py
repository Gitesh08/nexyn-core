import json
import logging
import httpx
import re
from typing import List, Optional
from collections import OrderedDict
from nexyn.models import NormalizedPayload, ValenceResult
from nexyn.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tier 1: LRU Memory Cache (0ms Latency)
# ---------------------------------------------------------------------------
MAX_CACHE_SIZE = 5000
_valence_cache: OrderedDict[str, List[ValenceResult]] = OrderedDict()

def _get_from_cache(content_hash: str) -> Optional[List[ValenceResult]]:
    if content_hash in _valence_cache:
        # Move to end to mark as recently used
        _valence_cache.move_to_end(content_hash)
        logger.debug(f"Tier 1: Cache hit for {content_hash}")
        return _valence_cache[content_hash]
    return None

def _add_to_cache(content_hash: str, results: List[ValenceResult]):
    if content_hash in _valence_cache:
        _valence_cache.move_to_end(content_hash)
    _valence_cache[content_hash] = results
    if len(_valence_cache) > MAX_CACHE_SIZE:
        _valence_cache.popitem(last=False)

# ---------------------------------------------------------------------------
# Tier 2: Fast-Path Heuristics (<1ms Latency)
# ---------------------------------------------------------------------------
def _fast_path_heuristic(text: str) -> Optional[List[ValenceResult]]:
    """
    Evaluates raw structural data without wasting LLM tokens.
    Returns evaluated ValenceResult if a heuristic matches, else None.
    """
    text_stripped = text.strip()
    length = len(text_stripped)
    
    # 1. Empty or extremely short (e.g. just "ok", "hi")
    if length < 3:
        return [ValenceResult(score=1, text=text_stripped, reasoning="Input too short to hold semantic value.")]

    # 2. Pure UUIDs
    uuid_pattern = re.compile(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
    if uuid_pattern.match(text_stripped):
        return [ValenceResult(score=1, text=text_stripped, reasoning="Pure UUID payload (Ephemeral).")]
        
    # 3. Base64 or Hex dumps (long strings with no spaces)
    if length > 200 and ' ' not in text_stripped:
        if re.match(r'^[a-zA-Z0-9+/]+={0,2}$', text_stripped):
            return [ValenceResult(score=1, text=text_stripped, reasoning="Base64 encoded binary data (Junk).")]
        if re.match(r'^[0-9a-fA-F]+$', text_stripped):
            return [ValenceResult(score=1, text=text_stripped, reasoning="Hexadecimal dump (Junk).")]

    # 4. Massive unstructured logs / monolithic code snippets (> 5000 chars)
    # Give them score 2 (Session Context) so they are available in memory but don't permanently bloat the core graph.
    if length > 5000:
        return [ValenceResult(score=2, text=text_stripped, reasoning="Massive payload. Auto-assigned to Session Context to prevent graph bloat.")]

    # No heuristic matched, proceed to Tier 3 (LLM)
    return None

# ---------------------------------------------------------------------------
# Tier 3: Optimized LLM Call (~500ms Latency)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """
You are the memory valence evaluator for an autonomous AI agent. Your task is to extract, clean, and score the long-term biological importance of information.
The input may contain typos, slang, fragmented thoughts, implicit context, code snippets, logs, URLs, or unexpected unstructured data. You must elegantly handle this noise and extract the underlying truth.

CRITICAL EXTRACTION RULES:
1. NORMALIZE & FIX: Silently correct typos, grammar, and expand slang. Resolve ambiguous pronouns if context allows.
2. PRESERVE RELATIONAL DENSITY: NEVER extract single isolated nouns (e.g., do not extract just "AWS"). You must extract full, self-contained semantic statements that preserve the absolute relational truth (e.g., "The user is planning a cloud migration from GCP to AWS next week").
3. DECOMPOSE ORGTHOGONAL FACTS: If the input contains multiple entirely unrelated concepts (e.g., "I hate apples and my API key is 1234"), split them into multiple JSON objects. If they are part of the same logical structure, keep them together.
4. CODE & LOGS: If the input is primarily a code snippet, stack trace, or system log, score it as 2 (Session Context) with a brief summary of what it is.

SCORING RUBRIC:
1 = Ephemeral/Junk — Momentary events, casual chatter, transient states, or things with zero relevance beyond the next 5 minutes.
2 = Session Context — Working memory, stack traces, code snippets, massive raw JSON payloads. Useful for the current conversation, but loses value once the immediate task is done.
3 = General Knowledge — Stable, objective facts, system architecture details, or public info that provides context but isn't a core directive.
4 = High-Value Memory — Subjective user preferences, recurring behavioral patterns, or significant insights that should heavily influence future workflows.
5 = Core Instinct / Absolute Rule — Hard safety constraints, fundamental identity traits, or explicit directives that must NEVER be violated or forgotten.

You must output a JSON object with a single key "results" containing an array of evaluation objects.
Example output format:
{
  "results": [
    {
      "text": "<complete semantic statement or summary>",
      "valence_score": <int 1-5>,
      "reason": "<short rationale>"
    }
  ]
}
"""

async def determine_valence(payload: NormalizedPayload) -> List[ValenceResult]:
    # Tier 1: Check LRU Cache
    cached = _get_from_cache(payload.content_hash)
    if cached:
        return cached

    # Tier 2: Fast-path heuristics
    heuristic_result = _fast_path_heuristic(payload.text)
    if heuristic_result:
        logger.debug(f"Tier 2: Fast-path heuristic matched for {payload.content_hash}")
        _add_to_cache(payload.content_hash, heuristic_result)
        return heuristic_result

    # Tier 3: LLM Evaluation
    if not payload.nim_key:
        logger.debug("NIM API key missing from payload. Defaulting valence score to 3.")
        res = [ValenceResult(score=3, reasoning="NIM API key missing. Defaulting to general fact.", text=payload.text)]
        _add_to_cache(payload.content_hash, res)
        return res
    
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {payload.nim_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": settings.NVIDIA_NIM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Input: {payload.text}"}
        ],
        "temperature": 0.0,
        "max_tokens": 512,
        "response_format": {"type": "json_object"}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            logger.debug(f"Tier 3: Requesting LLM evaluation for {payload.content_hash}")
            response = await client.post(url, headers=headers, json=data, timeout=15.0)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            
            try:
                parsed = json.loads(content)
                results_array = parsed.get("results", [])
                
                if not isinstance(results_array, list) or not results_array:
                    logger.warning("Valence output did not contain valid 'results' array. Falling back.")
                    res = [ValenceResult(score=3)]
                    _add_to_cache(payload.content_hash, res)
                    return res
                
                results = []
                for item in results_array:
                    if not isinstance(item, dict) or ("score" not in item and "valence_score" not in item):
                        continue
                    results.append(ValenceResult(
                        score=item.get("valence_score") or item.get("score"),
                        text=item.get("text", payload.text),
                        reasoning=item.get("reason", item.get("reasoning", "Evaluated by NIM."))
                    ))
                
                if not results:
                    res = [ValenceResult(score=3)]
                    _add_to_cache(payload.content_hash, res)
                    return res
                    
                _add_to_cache(payload.content_hash, results)
                return results
                
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                logger.error(f"Failed to parse valence JSON object: {e}")
                res = [ValenceResult(score=3, reasoning=f"Error parsing: {e}", text=payload.text)]
                _add_to_cache(payload.content_hash, res)
                return res
                
        except Exception as e:
            logger.debug(f"Valence evaluation failed: {e}")
            res = [ValenceResult(score=3, reasoning=f"Error evaluating: {e}", text=payload.text)]
            _add_to_cache(payload.content_hash, res)
            return res
