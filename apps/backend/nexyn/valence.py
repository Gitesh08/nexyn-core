import json
import logging
import httpx
from nexyn.models import NormalizedPayload, ValenceResult
from nexyn.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are the memory valence evaluator for an autonomous AI agent. Your task is to extract, clean, and score the long-term biological importance of information.
The input may contain typos, slang, fragmented thoughts, implicit context, or unexpected unstructured data. You must elegantly handle this noise and extract the underlying truth.

CRITICAL EXTRACTION RULES:
1. NORMALIZE & FIX: Silently correct typos, grammar, and expand slang. Resolve ambiguous pronouns if context allows.
2. PRESERVE RELATIONAL DENSITY: NEVER extract single isolated nouns (e.g., do not extract just "AWS"). You must extract full, self-contained semantic statements that preserve the absolute relational truth (e.g., "The user is planning a cloud migration from GCP to AWS next week").
3. DECOMPOSE ORGTHOGONAL FACTS: If the input contains multiple entirely unrelated concepts (e.g., "I hate apples and my API key is 1234"), split them into multiple JSON objects. If they are part of the same logical structure, keep them together.

Format:
Output ONLY valid JSON representing an array of objects. No preamble, no markdown.
[{"text": "<complete semantic statement>", "valence_score": <int 1-5>, "reason": "<short rationale>"}, ...]

SCORING RUBRIC:
1 = Ephemeral/Junk — Momentary events, casual chatter, transient states, or things with zero relevance beyond the next 5 minutes.
2 = Session Context — Working memory. Useful for the current conversation, but loses value once the immediate task is done.
3 = General Knowledge — Stable, objective facts, system architecture details, or public info that provides context but isn't a core directive.
4 = High-Value Memory — Subjective user preferences, recurring behavioral patterns, or significant insights that should heavily influence future workflows.
5 = Core Instinct / Absolute Rule — Hard safety constraints, fundamental identity traits, or explicit directives that must NEVER be violated or forgotten.
"""

async def determine_valence(payload: NormalizedPayload) -> list[ValenceResult]:
    if not payload.nim_key:
        logger.debug("NIM API key missing from payload. Defaulting valence score to 3.")
        return [ValenceResult(score=3, reasoning="NIM API key missing. Defaulting to general fact.", text=payload.text)]
    
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
                    if not isinstance(item, dict) or ("score" not in item and "valence_score" not in item):
                        logger.warning("Valence item missing 'valence_score' or not a dict. Falling back.")
                        continue
                    results.append(ValenceResult(
                        score=item.get("valence_score") or item.get("score"),
                        text=item.get("text", payload.text),
                        reasoning=item.get("reason", item.get("reasoning", "Parsed from fallback."))
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
