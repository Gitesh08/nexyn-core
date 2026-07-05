<div align="center">
    <img src="https://raw.githubusercontent.com/Gitesh08/nexyn-core/main/apps/frontend/public/nexyn-logo.svg" alt="Nexyn Logo" width="240" />
  <p><strong>Biological Memory Consolidation for Cognee</strong></p>
  
  [![PyPI version](https://img.shields.io/pypi/v/nexyn-core.svg?color=blue)](https://pypi.org/project/nexyn-core/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  
  <br />
  
  <a href="https://nexyn-core.vercel.app"><strong>🌐 Website</strong></a> |
  <a href="https://nexyn-core.vercel.app/demo"><strong>🎮 Demo</strong></a>
</div>

<br />

Nexyn Core is a lightweight Python library that adds human-like memory physics to your AI applications. Built specifically to run alongside [Cognee](https://github.com/topoteretes/cognee), it solves a major problem in AI memory systems: **context bloat**.

Instead of treating every piece of information equally, Nexyn automatically scores how important a memory is (Valence), applies a decay rate, and forgets irrelevant data over time—just like a human brain.

## What It Solves
- **Infinite Context Clutter:** AI agents quickly drown in their own logs. Nexyn ensures only the most important, reinforced memories survive long-term.
- **Flat Memory Structures:** Nexyn categorizes data dynamically. A passing thought decays in hours; a core user instruction (like "I am allergic to peanuts") becomes a permanent instinct.

## How It Works
1. **Sensory Buffer**: Intercepts data before it enters your vector database.
2. **Evaluator**: Uses NVIDIA NIM to quickly score the emotional/logical weight (Valence).
3. **Retrieval & Rehearsal**: Every time you search for a memory, Nexyn resets its decay timer (rehearsal), naturally surfacing things you think about often.
4. **Consolidation**: A background process sweeps your database and permanently deletes memories that have decayed to zero.

## 📦 Installation

```bash
# Using pip
pip install nexyn-core
```

## 🚀 Usage

Nexyn is designed to be completely invisible and is **100% compatible with both Cognee Cloud and Cognee Open Source (Local)**. 

> **Cloud vs Local Multi-Tenancy:** If you are using **Cognee Cloud**, pass `tenant_id` and `user_id` to `nexyn.inject()` to isolate your users' memory graphs. If you are running **Cognee Open Source locally**, leave these parameters blank in Nexyn, and instead pass `dataset_name="user_123"` directly into your `cognee.add()` calls to partition your data natively!

You simply initialize it once, and it automatically intercepts your native Cognee calls to apply biological physics. You don't need to learn a new API.

```python
import asyncio
import cognee
import nexyn

async def main():
    # 1. Initialize Nexyn's cognitive layer
    # For Cognee Cloud: Pass cognee_url and cognee_api_key
    # For Cognee Open Source (Local): Leave cognee_url empty
    await nexyn.inject(
        nim_api_key="nvapi-your-key-here", 
        cognee_api_key="your_cognee_api_key", # Leave empty for local open source
        cognee_url="https://api.cognee.ai",   # Leave empty for local open source
        tenant_id="default",                  # Leave empty for local open source
        user_id="user_123"                    # Leave empty for local open source
    )

    # 2. Add memories normally (Nexyn automatically scores Valence)
    await cognee.add("Doug is the groom. The wedding is Sunday.")
    
    # 3. Compile the Cognee knowledge graph
    await cognee.cognify()
    
    # 4. Search triggers decay physics and memory rehearsal
    results = await cognee.search("Where is Doug?")
    
    # 5. Fast-forward time to prune dead memories
    await nexyn.sweep()

if __name__ == "__main__":
    asyncio.run(main())
```

## 🎮 Interactive Dashboard
Want to see the biological pipeline in action? 
👉 **[Live Demo](https://nexyn-core.vercel.app/demo)**

## 📖 Read the Blog
Want to dive deeper into the theory behind Nexyn? Check out our official Medium article:
👉 **[Nexyn: Teaching AI to forget, so it can actually remember.](https://medium.com/@gitesh08/nexyn-teaching-ai-to-forget-so-it-can-actually-remember-c5ba0027657b)**

## 📝 License

Distributed under the MIT License.
