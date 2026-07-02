import aiosqlite
from datetime import datetime, timezone
from typing import Optional, List
from .models import MemoryTrace
from .config import settings

class WeightRegistry:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.registry_db_path

    async def init_db(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS weight_registry (
                    node_id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    dataset TEXT NOT NULL,
                    valence_score INTEGER NOT NULL,
                    weight_initial REAL NOT NULL,
                    decay_rate REAL NOT NULL,
                    last_accessed TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    reason TEXT,
                    status TEXT NOT NULL
                )
            ''')
            
            await db.execute('''
                CREATE TABLE IF NOT EXISTS ingest_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            ''')
            await db.commit()

    async def upsert(self, trace: MemoryTrace) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO weight_registry (
                    node_id, text, dataset, valence_score, weight_initial, 
                    decay_rate, last_accessed, created_at, reason, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(node_id) DO UPDATE SET
                    text=excluded.text,
                    dataset=excluded.dataset,
                    valence_score=excluded.valence_score,
                    weight_initial=excluded.weight_initial,
                    decay_rate=excluded.decay_rate,
                    last_accessed=excluded.last_accessed,
                    reason=excluded.reason,
                    status=excluded.status
            ''', (
                trace.node_id, trace.text, trace.dataset, trace.valence_score,
                trace.weight_initial, trace.decay_rate, 
                trace.last_accessed.isoformat(), trace.created_at.isoformat(), 
                trace.reason, trace.status
            ))
            await db.commit()

    async def get(self, node_id: str) -> Optional[MemoryTrace]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute('SELECT * FROM weight_registry WHERE node_id = ?', (node_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    )
                return None

    async def get_by_text(self, text: str) -> Optional[MemoryTrace]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute('SELECT * FROM weight_registry WHERE text = ?', (text,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    )
                return None

    async def get_by_fuzzy_text(self, text: str) -> Optional[MemoryTrace]:
        """Fallback method that strips whitespace and uses LIKE for robust matching."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            fuzzy_text = f"%{text.strip()}%"
            async with db.execute('SELECT * FROM weight_registry WHERE TRIM(text) LIKE ?', (fuzzy_text,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    )
                return None

    async def list_active(self, batch_size: int = 100, offset: int = 0) -> List[MemoryTrace]:
        """Fetch a paginated list of nodes that are not yet pruned."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                'SELECT * FROM weight_registry WHERE status != "pruned" LIMIT ? OFFSET ?',
                (batch_size, offset)
            ) as cursor:
                rows = await cursor.fetchall()
                results = []
                for row in rows:
                    results.append(MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    ))
                return results

    async def list_all(self, batch_size: int = 100, offset: int = 0) -> List[MemoryTrace]:
        """Fetch a paginated list of ALL nodes, including pruned ones, for debugging/logs."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                'SELECT * FROM weight_registry ORDER BY created_at DESC LIMIT ? OFFSET ?',
                (batch_size, offset)
            ) as cursor:
                rows = await cursor.fetchall()
                results = []
                for row in rows:
                    results.append(MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    ))
                return results

    async def mark_pruned(self, node_id: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('UPDATE weight_registry SET status = "pruned" WHERE node_id = ?', (node_id,))
            await db.commit()

    async def mark_pending_prune(self, node_id: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('UPDATE weight_registry SET status = "pending_prune" WHERE node_id = ?', (node_id,))
            await db.commit()

    async def touch_last_accessed(self, node_id: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('UPDATE weight_registry SET last_accessed = ? WHERE node_id = ?', (now, node_id))
            await db.commit()

    async def clear_all(self) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('DELETE FROM weight_registry')
            await db.commit()

    async def delete(self, node_id: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('DELETE FROM weight_registry WHERE node_id = ?', (node_id,))
            await db.commit()

    async def get_dataset_active(self, dataset: str) -> List[MemoryTrace]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute('SELECT * FROM weight_registry WHERE dataset = ? AND status != "pruned"', (dataset,)) as cursor:
                rows = await cursor.fetchall()
                results = []
                for row in rows:
                    results.append(MemoryTrace(
                        node_id=row['node_id'],
                        text=row['text'],
                        dataset=row['dataset'],
                        valence_score=row['valence_score'],
                        weight_initial=row['weight_initial'],
                        decay_rate=row['decay_rate'],
                        last_accessed=datetime.fromisoformat(row['last_accessed']),
                        created_at=datetime.fromisoformat(row['created_at']),
                        reason=row['reason'] or "",
                        status=row['status']
                    ))
                return results

    async def delete_dataset(self, dataset: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('DELETE FROM weight_registry WHERE dataset = ?', (dataset,))
            await db.commit()

class QueueRegistry:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.registry_db_path

    async def enqueue(self, payload_dict: dict) -> None:
        import json
        payload_str = json.dumps(payload_dict)
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('INSERT INTO ingest_queue (payload, created_at) VALUES (?, ?)', (payload_str, now))
            await db.commit()

    async def dequeue(self) -> Optional[dict]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            # Get the oldest item
            async with db.execute('SELECT * FROM ingest_queue ORDER BY id ASC LIMIT 1') as cursor:
                row = await cursor.fetchone()
                if row:
                    import json
                    payload = json.loads(row['payload'])
                    # Delete the item we just grabbed
                    await db.execute('DELETE FROM ingest_queue WHERE id = ?', (row['id'],))
                    await db.commit()
                    return payload
                return None
