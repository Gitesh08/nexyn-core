<div align="center">
  <img src="https://raw.githubusercontent.com/cognee-ai/nexyn-core/main/apps/frontend/public/nexyn-logo.svg" alt="Nexyn Logo" width="120" />
  <h1>Nexyn Core</h1>
  <p><strong>A Biomimetic Memory Consolidation Layer for LLMs</strong></p>
  
  [![PyPI version](https://badge.fury.io/py/nexyn-core.svg)](https://badge.fury.io/py/nexyn-core)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

<br />

Nexyn Core is a lightweight, stateless Python library that introduces human-like memory consolidation to LLM applications. Built on top of [Cognee](https://github.com/topoteretes/cognee), Nexyn acts as an intelligent intermediary layer that scores, decays, and prunes unstructured traces before they are permanently encoded into your knowledge graphs.

## ✨ Features

- 🧠 **Biomimetic 4-Layer Pipeline**: Emulates human memory stages (Sensory Buffer, Evaluator, Consolidation, Retrieval).
- 🏗️ **Stateless Multi-Tenancy**: Bring Your Own Key (BYOK) architecture designed to strictly isolate memory graphs by `tenant_id` and `user_id`.
- ⏳ **Automated Memory Decay**: Traces are assigned initial weights and decay rates based on LLM valence scoring; irrelevant memories naturally "forget" themselves over time.
- ⚡ **Seamless Cognee Integration**: Automatically compiles surviving high-weight memory traces into semantic knowledge graphs using Cognee.
- 🚀 **Built-in API Server**: Ships with an optional FastAPI server for immediate UI and dashboard integration.

## 📦 Installation

```bash
pip install nexyn-core
```

## 🚀 Quick Start

Nexyn can be used as a standalone background API server, or imported programmatically into your existing AI applications.

### 1. Running the API Server

If you want to use the built-in HTTP endpoints (perfect for dashboards and web apps), simply run the CLI command:

```bash
nexyn-server
```
The server will start on `http://0.0.0.0:8000`. It requires NO environment variables for API keys—everything is passed statelessly via headers (`x-tenant-id`, `x-user-id`, `x-nim-key`, `x-cognee-key`).

### 2. Programmatic Usage (Python API)

You can bypass the server and use Nexyn's core logic directly in your own scripts:

```python
import asyncio
from nexyn import NormalizedPayload, WeightRegistry
from nexyn.evaluation_engine import EvaluationEngine

async def main():
    registry = WeightRegistry()
    await registry.init_db()
    
    engine = EvaluationEngine(registry)
    
    # 1. Create a normalized payload with API Keys
    # Nexyn uses a Bring-Your-Own-Key (BYOK) architecture. 
    # Keys can be passed dynamically per-user for stateless multi-tenancy!
    payload = NormalizedPayload(
        text="The user mentioned they are allergic to peanuts.",
        timestamp=1700000000.0,
        content_hash="unique_hash_123",
        tenant_id="app_production",
        user_id="user_992",
        nim_key="your_nvidia_nim_key",    # Used for Valence Scoring (Llama 3)
        cognee_key="your_cognee_api_key", # Used for permanent graph consolidation
        cognee_url="https://api.cognee.ai"
    )
    
    # 2. Evaluate and score the memory (Layer 2)
    # The NVIDIA NIM LLM determines this is highly important and assigns it a slow decay rate.
    # It is then temporarily stored in the SQLite Registry.
    await engine.evaluate(payload)
    
    # 3. (Background) The Memory Consolidator will automatically sweep the registry.
    # Any memories with a Valence Score of 3 or higher are safely pushed to the Cognee Cloud!
    
    # 4. Retrieve all active memories locally
    active_memories = await registry.list_active("app_production", "user_992")
    print(f"Active memories in temporary buffer: {len(active_memories)}")

if __name__ == "__main__":
    asyncio.run(main())
```

## ⚙️ Configuration

By default, Nexyn creates a lightweight SQLite database in your home directory (`~/.nexyn/registry.db`) to track memory decay states.

For production deployments (or if you want to store it elsewhere), override the path using the environment variable:

```bash
export NEXYN_DB_PATH="/path/to/your/persistent/disk/nexyn.db"
```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
