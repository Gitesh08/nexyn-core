from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Consolidation
    decay_sweep_interval_seconds: int = 900
    consolidation_dry_run: bool = False
    prune_floor: float = 0.0

    # Retrieval
    retrieval_timeout_seconds: float = 30.0
    retrieval_cache_ttl_seconds: int = 30
    reinforce_on_recall: bool = False
    resonance_threshold: float = 0.85

    # Ingestion
    dedup_cache_size: int = 10000

    # Storage
    registry_db_path: str = "synapse_registry.db"

    # External APIs
    NVIDIA_NIM_API_KEY: str | None = None
    NVIDIA_NIM_MODEL: str = "meta/llama-3.1-8b-instruct"
    COGNEE_BASE_URL: str | None = None
    COGNEE_URL: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
