# CliniX Chatbot Service

The chatbot logic now lives in this Python FastAPI service. The Node/Express
backend keeps the existing `/api/chatbot/*` routes as an authenticated gateway,
then forwards requests here.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Required environment variables are read from `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/clinix
JWT_SECRET=your_jwt_secret
CHATBOT_SERVICE_URL=http://127.0.0.1:8001
CHATBOT_GATEWAY_SECRET=optional_shared_secret
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
OLLAMA_TIMEOUT_SECONDS=180
OLLAMA_KEEP_ALIVE=2h
OLLAMA_NUM_CTX=2048
OLLAMA_NUM_PREDICT=256
```

The chatbot uses an LLM only for language understanding/planning, then keeps all
real actions inside local Python code:

- `LLMPlanner`: converts user language into a typed Pydantic plan.
- `ClinixAgent`: owns the workflow, memory, validation, and tool calls.
- `tools.py`: contains typed, database-backed CliniX tools such as doctor search,
  appointment availability checks, and booking.

The model does not directly book appointments or invent database data. The
request, response, planner, agent, and tool contracts are all Pydantic models.
For local models through Ollama, make sure `ollama list` shows the exact model in
`OLLAMA_MODEL`. If Ollama is missing or the model fails, the agent can still
handle direct confirmations and slot selections from existing chat context, but
new natural-language medical routing needs the configured local model.

## Run

Start the Python chatbot. The npm script uses `uv` and the local
`.python-version` file to run on Python 3.12:

```bash
npm run chatbot
```

Start the existing Express API in another terminal:

```bash
npm run dev
```

The mobile app can keep calling:

```text
POST /api/chatbot/chat
GET /api/chatbot/history
DELETE /api/chatbot/history
```
