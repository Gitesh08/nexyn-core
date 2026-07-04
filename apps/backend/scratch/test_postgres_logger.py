import asyncio
import os
import sys
from pathlib import Path

# Add project roots to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from nexyn.remote_logger import log_remote, get_db_pool, close_db_pool

async def test():
    import os
    print("PG/Postgres Env Vars:", {k: v for k, v in os.environ.items() if "PG" in k.upper() or "POSTGRES" in k.upper()})
    from nexyn.config import settings
    print("DB Host:", settings.nexyn_logs_db_host)
    print("DB Port:", settings.nexyn_logs_db_port, type(settings.nexyn_logs_db_port))
    print("DB User:", settings.nexyn_logs_db_user)
    print("DB Name:", settings.nexyn_logs_db_name)
    print("DB Password:", settings.nexyn_logs_db_password)
    
    print("Testing connection to Postgres...")
    await log_remote(
        category="TEST_CONNECTION",
        level="INFO",
        message="Self-test connection to PostgreSQL",
        tenant_id="test_tenant",
        user_id="test_user",
        details={"status": "working"}
    )
    
    # Query database to verify insert
    pool = await get_db_pool()
    if pool:
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM nexyn_logs ORDER BY timestamp DESC LIMIT 5")
            print("\nFetched recent logs from PostgreSQL:")
            for r in rows:
                print(f"ID: {r['id']} | Timestamp: {r['timestamp']} | Category: {r['category']} | Message: {r['message']}")
    
    await close_db_pool()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(test())
