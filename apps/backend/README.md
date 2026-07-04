# Nexyn Core - Backend

This is the FastAPI backend for Nexyn Core. It exposes the biological memory endpoints (`/api/memories`, `/api/memify`, `/api/sweep`) used by the visual dashboard.

## Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The backend will start on `http://localhost:8000`. 
Note: The server is completely stateless and uses Bring-Your-Own-Key (BYOK). All API keys are passed via headers from the frontend client.
