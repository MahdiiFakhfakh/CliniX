from datetime import datetime, timezone
import logging
from typing import Any

from bson import ObjectId
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .agent import ClinixAgent
from .auth import get_current_user_id
from .config import get_settings
from .database import close_database, get_database
from .models import (
    ChatReply,
    ChatRequest,
    ChatResponse,
    ClearHistoryResponse,
    ClinixAgentInput,
    ConversationMessage,
    ErrorResponse,
    HistoryResponse,
    MEDICAL_CAUTION,
)


logger = logging.getLogger(__name__)
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown() -> None:
    await close_database()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _conversation_message(message: dict[str, Any]) -> ConversationMessage | None:
    try:
        return ConversationMessage(
            role=message.get("role"),
            content=message.get("content", ""),
            timestamp=message.get("timestamp") or datetime.now(timezone.utc),
        )
    except ValueError:
        return None


@app.post("/api/chatbot/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    patient_user_id: str = Depends(get_current_user_id),
) -> ChatResponse:
    try:
        db = get_database()
        patient_object_id = ObjectId(patient_user_id)
        conversation = await db.conversations.find_one({"patientId": patient_object_id})
        raw_messages = (conversation or {}).get("messages", [])[-20:]
        recent_messages = [
            parsed
            for parsed in (_conversation_message(message) for message in raw_messages)
            if parsed is not None
        ]

        agent = ClinixAgent(db)
        agent_output = await agent.run(
            ClinixAgentInput(
                message=request.message,
                patientUserId=patient_user_id,
                history=recent_messages,
                pendingAction=(conversation or {}).get("pendingAction"),
            ),
        )
        text = agent_output.content.strip()
        if not text:
            return ChatResponse(
                reply=ChatReply(
                    content="I couldn't generate a response. Please try again.",
                    caution=MEDICAL_CAUTION,
                ),
            )

        now = datetime.now(timezone.utc)
        await db.conversations.update_one(
            {"patientId": patient_object_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": request.message, "timestamp": now},
                            {"role": "assistant", "content": text, "timestamp": now},
                        ],
                    },
                },
                "$set": {"updatedAt": now},
                "$setOnInsert": {"patientId": patient_object_id},
            },
            upsert=True,
        )
        if "pendingAction" in agent_output.memory_updates:
            await db.conversations.update_one(
                {"patientId": patient_object_id},
                {"$set": {"pendingAction": agent_output.memory_updates["pendingAction"]}},
            )
        if agent_output.memory_updates.get("clearPendingAction"):
            await db.conversations.update_one(
                {"patientId": patient_object_id},
                {"$unset": {"pendingAction": ""}},
            )

        return ChatResponse(reply=ChatReply(content=text, caution=MEDICAL_CAUTION))
    except Exception:
        logger.exception("Chatbot request failed")
        return ChatResponse(
            reply=ChatReply(
                content="I hit a backend error while handling that. Please try again.",
                caution=MEDICAL_CAUTION,
            ),
        )


@app.get("/api/chatbot/history", response_model=HistoryResponse)
async def history(patient_user_id: str = Depends(get_current_user_id)) -> HistoryResponse:
    conversation = await get_database().conversations.find_one(
        {"patientId": ObjectId(patient_user_id)},
    )
    raw_messages = (conversation or {}).get("messages", [])
    messages = [
        parsed
        for parsed in (_conversation_message(message) for message in raw_messages)
        if parsed is not None
    ]
    return HistoryResponse(messages=messages)


@app.delete("/api/chatbot/history", response_model=ClearHistoryResponse)
async def clear_history(
    patient_user_id: str = Depends(get_current_user_id),
) -> ClearHistoryResponse:
    await get_database().conversations.delete_one({"patientId": ObjectId(patient_user_id)})
    return ClearHistoryResponse(message="Conversation cleared")
