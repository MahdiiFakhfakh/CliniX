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
```

The chatbot uses an external LLM only for language understanding/planning, then
keeps all real actions inside local Python code:

- `LLMPlanner`: converts user language into a typed Pydantic plan.
- `ClinixAgent`: owns the workflow, memory, validation, and tool calls.
- `tools.py`: contains typed, database-backed CliniX tools such as doctor search,
  appointment availability checks, and booking.

The model does not directly book appointments or invent database data. The
request, response, planner, agent, and tool contracts are all Pydantic models.
If the LLM key is missing or the provider fails, the service falls back to a
simple local parser so the app still works during development.

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
