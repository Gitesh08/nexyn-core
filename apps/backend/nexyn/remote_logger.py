import asyncpg
import logging
import json
import asyncio
from datetime import datetime, timezone
from nexyn.config import settings

logger = logging.getLogger(__name__)

_pool = None
_pool_loop = None
_pool_lock = asyncio.Lock()

async def get_db_pool():
    global _pool, _pool_loop
    
    if _pool is not None:
        try:
            current_loop = asyncio.get_running_loop()
            if _pool_loop != current_loop or current_loop.is_closed():
                _pool = None
                _pool_loop = None
        except RuntimeError:
            _pool = None
            _pool_loop = None

    if _pool is not None:
        return _pool

    async with _pool_lock:
        if _pool is not None:
            return _pool

        host = settings.nexyn_logs_db_host
        port = settings.nexyn_logs_db_port
        user = settings.nexyn_logs_db_user
        password = settings.nexyn_logs_db_password
        dbname = settings.nexyn_logs_db_name

        import urllib.parse
        quoted_user = urllib.parse.quote_plus(user)
        quoted_password = urllib.parse.quote_plus(password)

        # DSN construction
        dsn = f"postgresql://{quoted_user}:{quoted_password}@{host}:{port}/{dbname}"
        logger.info(f"Connecting to remote PostgreSQL logging at {host}:{port}/{dbname}")

        try:
            current_loop = asyncio.get_running_loop()
            # Create the pool
            _pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=1,
                max_size=5,
                timeout=10.0,
                command_timeout=10.0
            )
            _pool_loop = current_loop
            # Create logs table if it doesn't exist
            async with _pool.acquire() as conn:
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS nexyn_logs (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        category VARCHAR(50) NOT NULL,
                        level VARCHAR(10) NOT NULL,
                        message TEXT NOT NULL,
                        tenant_id VARCHAR(100),
                        user_id VARCHAR(100),
                        details JSONB
                    )
                ''')
            logger.info("Remote PostgreSQL logger initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize remote PostgreSQL connection pool: {e}")
            _pool = None
            _pool_loop = None

        return _pool

async def close_db_pool():
    global _pool
    async with _pool_lock:
        if _pool is not None:
            try:
                await _pool.close()
                logger.info("Closed remote PostgreSQL logging pool.")
            except Exception as e:
                logger.error(f"Error closing remote PostgreSQL logging pool: {e}")
            _pool = None

async def log_remote(
    category: str,
    level: str,
    message: str,
    tenant_id: str | None = None,
    user_id: str | None = None,
    details: dict | None = None
):
    """
    Log message to remote PostgreSQL asynchronously.
    Fails gracefully to console if remote database is unreachable.
    """
    # Always log locally first
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(f"[{category}] {message}")

    try:
        pool = await get_db_pool()
        if pool is None:
            return

        details_json = json.dumps(details) if details else "{}"

        # Insert log record
        async with pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO nexyn_logs (category, level, message, tenant_id, user_id, details)
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', category, level, message, tenant_id, user_id, details_json)
    except Exception as e:
        logger.warning(f"Failed to insert remote log record to PostgreSQL: {e}")
