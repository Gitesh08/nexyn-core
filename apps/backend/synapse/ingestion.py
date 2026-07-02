import hashlib
import time
from collections import OrderedDict
from pydantic import BaseModel, Field
from .config import settings
from typing import List
import re

class IngestPayload(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class NormalizedPayload(BaseModel):
    text: str
    timestamp: float
    content_hash: str

def get_trigrams(text: str) -> set:
    words = text.lower().split()
    if len(words) < 3:
        return set(words)
    return set(tuple(words[i:i+3]) for i in range(len(words)-2))

def jaccard_similarity(set1: set, set2: set) -> float:
    if not set1 and not set2:
        return 1.0
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)

class DuplicateCache:
    """Bounded LRU set of recently-seen content hashes for O(1) rapid-fire dedup."""

    def __init__(self, max_size: int | None = None):
        self._max_size = max_size or settings.dedup_cache_size
        self._seen: OrderedDict[str, set] = OrderedDict()

    def check_and_add(self, content_hash: str, text: str) -> bool:
        """Returns True if this hash was already seen or if semantic similarity is too high."""
        if content_hash in self._seen:
            self._seen.move_to_end(content_hash)
            return True
            
        trigrams = get_trigrams(text)
        
        # Check semantic similarity against last 10 items to prevent $O(N)$ slowdown
        recent_items = list(self._seen.values())[-10:]
        for cached_trigrams in recent_items:
            if jaccard_similarity(trigrams, cached_trigrams) > 0.85:
                return True
                
        self._seen[content_hash] = trigrams
        if len(self._seen) > self._max_size:
            self._seen.popitem(last=False)
        return False

duplicate_cache = DuplicateCache()

def normalize(payload: IngestPayload) -> List[NormalizedPayload]:
    """Sensory Fission: Chunk long texts and return a list of NormalizedPayloads."""
    stripped_text = payload.text.strip()
    
    # Simple semantic chunking if text > 1000 chars
    chunks = []
    if len(stripped_text) > 1000:
        # Split by paragraphs or sentences
        sentences = re.split(r'(?<=[.!?])\s+', stripped_text)
        current_chunk = ""
        for sentence in sentences:
            if len(current_chunk) + len(sentence) > 500:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += (" " if current_chunk else "") + sentence
        if current_chunk:
            chunks.append(current_chunk.strip())
    else:
        chunks = [stripped_text]
        
    payloads = []
    timestamp = time.time()
    for chunk in chunks:
        if not chunk: continue
        content_hash = hashlib.sha256(chunk.encode("utf-8")).hexdigest()
        payloads.append(NormalizedPayload(text=chunk, timestamp=timestamp, content_hash=content_hash))
        
    return payloads
