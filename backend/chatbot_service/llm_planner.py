from datetime import datetime
import json
import logging
import re
from typing import Any

import httpx
from pydantic import ValidationError

from .config import get_settings
from .models import ClinixAgentInput, ClinixPlannerOutput


logger = logging.getLogger(__name__)


PLANNER_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": [
                "greeting",
                "medical_info",
                "doctor_search",
                "appointment",
                "emergency",
                "unknown",
            ],
        },
        "action": {
            "type": "string",
            "enum": [
                "greeting",
                "medical_info",
                "list_doctors",
                "check_availability",
                "prepare_booking",
                "confirm_booking",
                "emergency",
                "clarify",
            ],
        },
        "doctorName": {"type": ["string", "null"]},
        "field": {"type": ["string", "null"]},
        "symptom": {"type": ["string", "null"]},
        "date": {"type": ["string", "null"]},
        "time": {"type": ["string", "null"]},
        "reason": {"type": ["string", "null"]},
        "response": {"type": ["string", "null"]},
    },
    "required": [
        "intent",
        "action",
        "doctorName",
        "field",
        "symptom",
        "date",
        "time",
        "reason",
        "response",
    ],
    "additionalProperties": False,
}


PLANNER_SYSTEM_PROMPT = """You are CliniX's JSON planner. Return ONLY one minified JSON object with:
intent: greeting|medical_info|doctor_search|appointment|emergency|unknown
action: greeting|medical_info|list_doctors|check_availability|prepare_booking|confirm_booking|emergency|clarify
doctorName, field, symptom, date, time, reason, response: string or null

Rules:
- Never return markdown, comments, arrays, XML, or multiple JSON objects.
- Every key must exist exactly once. Unknown values must be null.
- Keep response under 25 words.
- Patients do not need to know doctor names. When they describe symptoms, ask for doctors, ask who to see, or ask for a specialist, infer the field and use action list_doctors so the agent can show matching database doctors.
- Never invent doctor names. Set doctorName only when the user names one or clearly selects one from the assistant's previously listed doctors.
- Use history to resolve short follow-ups. If the assistant recently listed "Dr. Patricia Brown" and the user says "Patricia" or "the first one", set doctorName to "Patricia Brown".
- If the user sends comma-separated booking details like "Patricia brown, tomorrow, 12pm, headache", use action prepare_booking with doctorName, date, time, and reason.
- If the user gives only a doctor name after asking to book, use action clarify and ask only for the missing date, time, and reason.
- If the user gives doctor plus date but no time/reason, use action clarify and ask only for the missing time and reason.
- If the recent history contains "Booked." and the user mentions a new symptom, treat it as a new medical/doctor-search request, not a continuation of the old booking.
- Infer the most appropriate medical specialty/department yourself whenever the user gives a symptom. The Python agent does not contain symptom routing rules.
- If availableSpecialties is provided in the user context, choose the field from that list whenever possible and copy it exactly.
- Do not use a specialty outside availableSpecialties unless no provided specialty is relevant.
- For doctor search, availability checks, and specialty bookings from symptoms, always set field to the inferred available specialty if possible.
- The field is not limited to the examples. Use any matching item from availableSpecialties.
- If the user asks for doctors, a specialist, a consultation, a checkup, who to see, or someone to help with a symptom, use action list_doctors.
- If the user only asks a general health question and is not asking to find care, use action medical_info.
- If the user asks whether a doctor/specialty is available or asks for times, use action check_availability.
- If the user asks to book and provides enough date/time plus doctorName or field, use action prepare_booking.
- If the user confirms a pending booking, use action confirm_booking.
- For medical questions, give general info only. Never diagnose or prescribe.
- Use the provided current date to resolve today/tomorrow.
Examples:
"Doctors for headache" -> {"intent":"doctor_search","action":"list_doctors","doctorName":null,"field":"Neurology","symptom":"headache","date":null,"time":null,"reason":null,"response":null}
"I have a rash, who should I see?" -> {"intent":"doctor_search","action":"list_doctors","doctorName":null,"field":"Dermatology","symptom":"rash","date":null,"time":null,"reason":null,"response":null}
"Patricia brown, tomorrow, 12pm, headache" -> {"intent":"appointment","action":"prepare_booking","doctorName":"Patricia Brown","field":null,"symptom":"headache","date":"<tomorrow>","time":"12:00","reason":"headache","response":null}
"""


class LLMPlanner:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def warm_up(self) -> None:
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.ollama_timeout_seconds,
            ) as client:
                await client.post(
                    f"{self.settings.ollama_base_url.rstrip('/')}/api/chat",
                    json={
                        "model": self.settings.ollama_model,
                        "messages": [{"role": "user", "content": "{}"}],
                        "stream": False,
                        "format": PLANNER_RESPONSE_SCHEMA,
                        "keep_alive": self.settings.ollama_keep_alive,
                        "think": False,
                        "options": {
                            "temperature": 0,
                            "num_ctx": self.settings.ollama_num_ctx,
                            "num_predict": 1,
                        },
                    },
                )
        except httpx.HTTPError as exc:
            logger.warning("Ollama warm-up failed: %s", exc)

    async def plan(
        self,
        agent_input: ClinixAgentInput,
        available_specialties: list[str] | None = None,
    ) -> ClinixPlannerOutput | None:
        messages = self._build_messages(
            agent_input,
            available_specialties=available_specialties,
        )
        return await self._plan_with_ollama(messages)

    def _build_messages(
        self,
        agent_input: ClinixAgentInput,
        available_specialties: list[str] | None = None,
    ) -> list[dict[str, str]]:
        history = [
            {"role": item.role.value, "content": item.content}
            for item in agent_input.history[-4:]
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
            "availableSpecialties": available_specialties or [],
        }
        return [
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    json.dumps(user_context, separators=(",", ":"))
                ),
            },
        ]

    async def _plan_with_ollama(
        self,
        messages: list[dict[str, str]],
    ) -> ClinixPlannerOutput | None:
        content = await self._request_ollama(
            messages,
            num_predict=self.settings.ollama_num_predict,
        )
        if content is None:
            return None

        try:
            return self._validate_plan_content(content)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.debug(
                "Ollama planner returned invalid output on first attempt: %s. Raw: %.300r",
                exc,
                content,
            )

        repaired = await self._repair_plan_content(messages, content)
        if repaired is None:
            return None

        try:
            return self._validate_plan_content(repaired)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.warning(
                "Ollama planner returned invalid output after repair: %s. Raw: %.300r",
                exc,
                repaired,
            )
            return None

    async def _request_ollama(
        self,
        messages: list[dict[str, str]],
        num_predict: int,
    ) -> str | None:
        try:
            async with httpx.AsyncClient(
                timeout=self.settings.ollama_timeout_seconds,
            ) as client:
                response = await client.post(
                    f"{self.settings.ollama_base_url.rstrip('/')}/api/chat",
                    json={
                        "model": self.settings.ollama_model,
                        "messages": messages,
                        "stream": False,
                        "format": PLANNER_RESPONSE_SCHEMA,
                        "keep_alive": self.settings.ollama_keep_alive,
                        "think": False,
                        "options": {
                            "temperature": 0,
                            "num_ctx": self.settings.ollama_num_ctx,
                            "num_predict": num_predict,
                        },
                    },
                )
        except httpx.HTTPError as exc:
            logger.warning("Ollama planner request failed: %s", exc)
            return None

        if response.status_code >= 400:
            logger.warning(
                "Ollama planner returned status %s: %s",
                response.status_code,
                response.text,
            )
            return None

        try:
            content = response.json()["message"].get("content")
            if not isinstance(content, str) or not content.strip():
                logger.warning("Ollama planner returned empty content: %s", response.text)
                return None

            return content
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            logger.warning("Ollama planner returned unreadable response: %s", exc)
            return None

    async def _repair_plan_content(
        self,
        original_messages: list[dict[str, str]],
        invalid_content: str,
    ) -> str | None:
        repair_context = {
            "originalUserContext": original_messages[-1]["content"],
            "invalidOutput": invalid_content,
            "instruction": (
                "Return one minified valid JSON object matching the schema. "
                "Do not add explanations. Use null for missing values."
            ),
        }
        repair_messages = [
            {
                "role": "system",
                "content": (
                    "You repair CliniX planner output. Return ONLY valid minified JSON "
                    "with keys intent, action, doctorName, field, symptom, date, time, "
                    "reason, response."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(repair_context, separators=(",", ":")),
            },
        ]
        return await self._request_ollama(
            repair_messages,
            num_predict=max(self.settings.ollama_num_predict, 256),
        )

    def _validate_plan_content(self, content: str) -> ClinixPlannerOutput:
        raw_plan: dict[str, Any] = json.loads(self._extract_json_object(content))
        return ClinixPlannerOutput.model_validate(raw_plan)

    def _extract_json_object(self, content: str) -> str:
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
            content = re.sub(r"\s*```$", "", content)

        if content.startswith("{") and content.endswith("}"):
            return content

        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if not match:
            raise json.JSONDecodeError("No JSON object found", content, 0)
        return match.group(0)
