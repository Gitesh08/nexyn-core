import json
import logging
import httpx
from synapse.models import NormalizedPayload, ValenceResult
from synapse.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are the memory valence evaluator for an autonomous AI agent. Your task is to score the long-term biological importance of a piece of information.
Consider context: Is this a transient event, a persistent fact, a subjective preference, or a hard system constraint?

Output ONLY valid JSON representing an array of objects. If the input contains multiple independent concepts with wildly different importance, split them into multiple objects. Otherwise, return an array with a single object:
[{"text": "<the specific substring or concept>", "valence_score": <int 1-5>, "reason": "<one sentence>"}, ...]
No preamble. No markdown.

Scoring rubric:
1 = Ephemeral/Junk — Momentary events, typos, casual greetings, or transient states with zero relevance beyond the next 5 minutes.
2 = Session Context — Working memory. Useful for the current conversation or task, but loses value once the task is complete.
3 = General Knowledge — Stable, objective facts, structural knowledge, or public information that provides context but doesn't define core behavior.
4 = High-Value Memory — Subjective preferences, recurring behavioral patterns, important relationships, or significant insights that should heavily influence future interactions.
5 = Core Instinct / Absolute Rule — Hard constraints, fundamental identity traits, safety protocols, or explicit directives that must NEVER be violated or forgotten.
"""

async def determine_valence(payload: NormalizedPayload) -> list[ValenceResult]:
    if not settings.NVIDIA_NIM_API_KEY:
        logger.debug("NVIDIA_NIM_API_KEY not set. Defaulting valence score to 3.")
        return [ValenceResult(score=3, reasoning="NIM API key missing. Defaulting to general fact.", text=payload.text)]
    
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_NIM_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": settings.NVIDIA_NIM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Input: {payload.text}"}
        ],
        "temperature": 0.0,
        "max_tokens": 250
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data, timeout=15.0)
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            
            # Remove markdown if any
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
                
            try:
                parsed = json.loads(content)
                if not isinstance(parsed, list):
                    logger.warning("Valence output is not a list. Falling back to default.")
                    return [ValenceResult(score=3)]
                
                results = []
                for item in parsed:
                    if not isinstance(item, dict) or "score" not in item:
                        logger.warning("Valence item missing 'score' or not a dict. Falling back.")
                        continue
                    results.append(ValenceResult(
                        score=item["score"],
                        text=item.get("text", payload.text),
                        reasoning=item.get("reasoning", "Parsed from fallback.")
                    ))
                
                if not results:
                    return [ValenceResult(score=3)]
                return results
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                logger.error(f"Failed to parse valence JSON: {e}")
                return [ValenceResult(score=3, reasoning=f"Error evaluating: {e}", text=payload.text)]
        except Exception as e:
            logger.debug(f"Valence evaluation failed: {e}")
            return [ValenceResult(score=3, reasoning=f"Error evaluating: {e}", text=payload.text)]
