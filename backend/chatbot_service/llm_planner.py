from datetime import datetime
import json
import logging
from typing import Any

import httpx
from pydantic import ValidationError

from .config import get_settings
from .models import ClinixAgentInput, ClinixPlannerOutput


logger = logging.getLogger(__name__)


PLANNER_SYSTEM_PROMPT = """You are the language understanding model for CliniX.
Return ONLY valid JSON that matches this schema:
{
  "intent": "greeting|medical_info|doctor_search|appointment|emergency|unknown",
  "action": "greeting|medical_info|list_doctors|check_availability|prepare_booking|confirm_booking|emergency|clarify",
  "doctorName": string or null,
  "field": medical specialty/department or null,
  "symptom": symptom phrase or null,
  "date": ISO date YYYY-MM-DD or null,
  "time": 24-hour HH:MM or null,
  "reason": appointment reason or null,
  "response": short reply for greeting, medical info, emergency, or clarification
}

Rules:
- Do not invent doctor names. Only set doctorName when the user explicitly names one.
- Use history to resolve short follow-ups. If the assistant recently listed "Dr. Patricia Brown" and the user says "Patricia", set doctorName to "Patricia Brown".
- If the user sends comma-separated booking details like "Patricia brown, tomorrow, 12pm, headache", use action prepare_booking with doctorName, date, time, and reason.
- If the user gives only a doctor name after asking to book, use action clarify and ask only for the missing date, time, and reason.
- If the user gives doctor plus date but no time/reason, use action clarify and ask only for the missing time and reason.
- If the recent history contains "Booked." and the user mentions a new symptom, treat it as a new medical/doctor-search request, not a continuation of the old booking.
- Convert symptom to a likely field when useful: headache/migraine -> Neurology, rash/acne -> Dermatology, chest pain/heart -> Cardiology, cough/asthma -> Pulmonology, stomach/vomiting -> Gastroenterology, fever/flu -> Family Medicine.
- If the user asks for doctors, use action list_doctors.
- If the user asks whether a doctor/specialty is available or asks for times, use action check_availability.
- If the user asks to book and provides enough date/time plus doctorName or field, use action prepare_booking.
- If the user confirms a pending booking, use action confirm_booking.
- For medical questions, give general info only. Never diagnose or prescribe.
- Use the provided current date to resolve today/tomorrow.

Examples:
User: "Doctors for headache"
JSON: {"intent":"doctor_search","action":"list_doctors","doctorName":null,"field":"Neurology","symptom":"headache","date":null,"time":null,"reason":null,"response":null}

User: "Patricia brown, tomorrow, 12pm, headache"
JSON: {"intent":"appointment","action":"prepare_booking","doctorName":"Patricia Brown","field":null,"symptom":"headache","date":"<tomorrow as YYYY-MM-DD>","time":"12:00","reason":"headache","response":null}

User: "Patricia brown"
JSON: {"intent":"appointment","action":"clarify","doctorName":"Patricia Brown","field":null,"symptom":null,"date":null,"time":null,"reason":null,"response":"What date, time, and reason should I use for Dr. Patricia Brown?"}
"""


class LLMPlanner:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def plan(self, agent_input: ClinixAgentInput) -> ClinixPlannerOutput | None:
        if not self.settings.openrouter_api_key:
            return None

        history = [
            {"role": item.role.value, "content": item.content}
            for item in agent_input.history[-8:]
        ]
        user_context = {
            "currentDate": datetime.now().strftime("%Y-%m-%d"),
            "message": agent_input.message,
            "history": history,
            "pendingAction": (
                agent_input.pending_action.model_dump(by_alias=True)
                if agent_input.pending_action
                else None
            ),
        }

        try:
            async with httpx.AsyncClient(timeout=25) as client:
                response = await client.post(
                    f"{self.settings.openrouter_base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.settings.openrouter_model,
                        "messages": [
                            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
                            {"role": "user", "content": json.dumps(user_context)},
                        ],
                        "temperature": 0,
                        "response_format": {"type": "json_object"},
                    },
                )
        except httpx.HTTPError as exc:
            logger.warning("LLM planner request failed: %s", exc)
            return None

        if response.status_code >= 400:
            logger.warning(
                "LLM planner returned status %s: %s",
                response.status_code,
                response.text,
            )
            return None

        try:
            content = response.json()["choices"][0]["message"]["content"]
            raw_plan: dict[str, Any] = json.loads(content)
            return ClinixPlannerOutput.model_validate(raw_plan)
        except (KeyError, json.JSONDecodeError, ValidationError) as exc:
            logger.warning("LLM planner returned invalid output: %s", exc)
            return None
