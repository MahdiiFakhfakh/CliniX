from datetime import datetime
import re

from motor.motor_asyncio import AsyncIOMotorDatabase

from .llm_planner import LLMPlanner
from .medical_routing import field_from_symptom
from .models import (
    BookAppointmentInput,
    CheckAvailableSlotsInput,
    ClinixAgentInput,
    ClinixAgentOutput,
    ClinixPlannerOutput,
    GetAvailableSlotsInput,
    ListDoctorsInput,
    ModelIntent,
    PendingAction,
    ToolExecution,
)
from .tools import book_appointment, check_available_slots, get_available_slots, list_doctors


class ClinixAgent:
    """Own CliniX agent that coordinates LLM planning, tools, and memory."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.planner = LLMPlanner()

    async def run(self, agent_input: ClinixAgentInput) -> ClinixAgentOutput:
        if agent_input.pending_action and self._booking_was_completed_after_pending(
            agent_input.history,
        ):
            agent_input = agent_input.model_copy(update={"pending_action": None})

        if self._is_confirmation(agent_input.message):
            if agent_input.pending_action:
                output = await self._confirm_booking(agent_input)
                return self._with_memory_updates(output)

            recovered_pending = self._pending_booking_from_history(agent_input.history)
            if recovered_pending:
                output = await self._confirm_booking(
                    agent_input.model_copy(update={"pending_action": recovered_pending}),
                )
                return self._with_memory_updates(output)

        slot_selection = self._slot_selection_from_history(
            agent_input.message,
            agent_input.history,
        )
        if slot_selection:
            return self._with_memory_updates(slot_selection)

        plan = await self.planner.plan(agent_input)
        if plan is None:
            fallback_output = await self._known_symptom_failsafe(agent_input.message)
            if fallback_output:
                return self._with_memory_updates(fallback_output)

            return ClinixAgentOutput(
                content=(
                    "The language model is unavailable, so I cannot understand that "
                    "request right now. Please check OPENROUTER_API_KEY, credits, and "
                    "OPENROUTER_MODEL in backend/.env, then restart the chatbot service."
                ),
                intent=ModelIntent.unknown,
            )

        output = await self._execute_plan(plan, agent_input)
        return self._with_memory_updates(output)

    async def _execute_plan(
        self,
        plan: ClinixPlannerOutput,
        agent_input: ClinixAgentInput,
    ) -> ClinixAgentOutput:
        action = plan.action

        if action == "confirm_booking":
            return await self._confirm_booking(agent_input)

        if action == "list_doctors":
            return await self._list_doctors(plan)

        if action == "check_availability":
            return await self._check_availability(plan)

        if action == "prepare_booking":
            return await self._prepare_booking(plan)

        if action in {"greeting", "medical_info", "emergency", "clarify"}:
            return ClinixAgentOutput(
                content=plan.response or self._default_response(action),
                intent=plan.intent,
            )

        return ClinixAgentOutput(
            content=plan.response
            or "I can help with doctors, availability, and appointment booking.",
            intent=ModelIntent.unknown,
        )

    async def _list_doctors(self, plan: ClinixPlannerOutput) -> ClinixAgentOutput:
        field = plan.field or self._field_from_symptom(plan.symptom)
        if not field:
            return ClinixAgentOutput(
                content="Which medical field or symptom should I search for?",
                intent=ModelIntent.doctor_search,
            )

        payload = ListDoctorsInput(field=field, limit=8)
        result = await list_doctors(self.db, payload)
        tool_call = self._tool_call("list_doctors", payload, result)

        if not result.doctors:
            return ClinixAgentOutput(
                content=result.message or f"I could not find doctors for {field}.",
                intent=ModelIntent.doctor_search,
                toolCalls=[tool_call],
            )

        lines = [f"I found these doctors for {field}:"]
        for index, doctor in enumerate(result.doctors, start=1):
            fee = (
                f", fee ${doctor.consultation_fee}"
                if doctor.consultation_fee is not None
                else ""
            )
            experience = (
                f", {doctor.experience} years experience"
                if doctor.experience is not None
                else ""
            )
            lines.append(
                f"{index}. Dr. {doctor.doctor_name} - {doctor.specialization} "
                f"({doctor.status or 'status unknown'}{experience}{fee})"
            )
        lines.append("Ask for availability if you want open time slots.")

        return ClinixAgentOutput(
            content="\n".join(lines),
            intent=ModelIntent.doctor_search,
            toolCalls=[tool_call],
        )

    async def _known_symptom_failsafe(self, message: str) -> ClinixAgentOutput | None:
        field = self._field_from_symptom(message)
        if not field:
            return None

        payload = ListDoctorsInput(field=field, limit=5)
        result = await list_doctors(self.db, payload)
        tool_call = self._tool_call("list_doctors", payload, result)
        if not result.doctors:
            return ClinixAgentOutput(
                content=(
                    f"That symptom is commonly handled by {field}, but I could not "
                    "find matching doctors in the database."
                ),
                intent=ModelIntent.doctor_search,
                toolCalls=[tool_call],
            )

        lines = [
            f"For that symptom, {field} is usually the relevant field.",
            f"I found these {field} doctors:",
        ]
        for index, doctor in enumerate(result.doctors, start=1):
            lines.append(
                f"{index}. Dr. {doctor.doctor_name} - {doctor.specialization} "
                f"({doctor.status or 'status unknown'})"
            )
        lines.append("Ask for availability if you want open time slots.")
        return ClinixAgentOutput(
            content="\n".join(lines),
            intent=ModelIntent.doctor_search,
            toolCalls=[tool_call],
        )

    async def _check_availability(self, plan: ClinixPlannerOutput) -> ClinixAgentOutput:
        requested = self._parse_date(plan.date)
        field = plan.field or self._field_from_symptom(plan.symptom)
        if not requested:
            return ClinixAgentOutput(
                content="Which date should I check?",
                intent=ModelIntent.appointment,
            )
        if not plan.doctor_name and not field:
            return ClinixAgentOutput(
                content="Which doctor or specialty should I check?",
                intent=ModelIntent.appointment,
            )

        payload = GetAvailableSlotsInput(
            doctorName=plan.doctor_name,
            field=None if plan.doctor_name else field,
            requestedDate=requested,
            limit=5,
        )
        result = await get_available_slots(self.db, payload)
        tool_call = self._tool_call("get_available_slots", payload, result)

        if not result.options:
            return ClinixAgentOutput(
                content=result.message or "I could not find open slots for that date.",
                intent=ModelIntent.appointment,
                toolCalls=[tool_call],
            )

        lines = [f"Here are available slots for {requested.strftime('%A, %B %d, %Y')}:"]
        for option in result.options:
            lines.append(
                f"- Dr. {option.doctor_name} ({option.specialization}): "
                f"{', '.join(option.times[:6])}"
            )
        lines.append("Tell me which time you want and the reason for the visit to book it.")

        return ClinixAgentOutput(
            content="\n".join(lines),
            intent=ModelIntent.appointment,
            toolCalls=[tool_call],
        )

    async def _prepare_booking(self, plan: ClinixPlannerOutput) -> ClinixAgentOutput:
        appointment_at = self._parse_datetime(plan.date, plan.time)
        field = plan.field or self._field_from_symptom(plan.symptom)
        reason = plan.reason or plan.symptom

        missing = []
        if not plan.doctor_name and not field:
            missing.append("doctor name or specialty")
        if not appointment_at:
            missing.append("date and time")
        if not reason:
            missing.append("reason for the visit")
        if missing:
            return ClinixAgentOutput(
                content=f"To book that appointment, please send the {', '.join(missing)}.",
                intent=ModelIntent.appointment,
            )

        if plan.doctor_name:
            return await self._prepare_named_doctor_booking(
                plan.doctor_name,
                appointment_at,
                reason,
            )

        return await self._prepare_specialty_booking(field, appointment_at, reason)

    async def _prepare_named_doctor_booking(
        self,
        doctor_name: str,
        appointment_at: datetime,
        reason: str,
    ) -> ClinixAgentOutput:
        payload = CheckAvailableSlotsInput(
            doctorName=doctor_name,
            requestedDate=appointment_at,
        )
        result = await check_available_slots(self.db, payload)
        tool_call = self._tool_call("check_available_slots", payload, result)

        if not result.available:
            return ClinixAgentOutput(
                content=result.reason or "That slot is not available.",
                intent=ModelIntent.appointment,
                toolCalls=[tool_call],
            )

        pending = PendingAction(
            action="book_appointment",
            doctorName=result.doctor_name or doctor_name,
            appointmentDate=appointment_at,
            reason=reason,
        )
        return ClinixAgentOutput(
            content=self._booking_confirmation_text(pending),
            intent=ModelIntent.appointment,
            pendingAction=pending,
            toolCalls=[tool_call],
        )

    async def _prepare_specialty_booking(
        self,
        field: str,
        appointment_at: datetime,
        reason: str,
    ) -> ClinixAgentOutput:
        payload = GetAvailableSlotsInput(
            field=field,
            requestedDate=appointment_at,
            limit=8,
        )
        slots = await get_available_slots(self.db, payload)
        tool_call = self._tool_call("get_available_slots", payload, slots)

        requested_time = appointment_at.strftime("%H:%M")
        for option in slots.options:
            if requested_time in option.times:
                pending = PendingAction(
                    action="book_appointment",
                    doctorName=option.doctor_name,
                    appointmentDate=appointment_at,
                    reason=reason,
                )
                return ClinixAgentOutput(
                    content=self._booking_confirmation_text(pending),
                    intent=ModelIntent.appointment,
                    pendingAction=pending,
                    toolCalls=[tool_call],
                )

        if slots.options:
            lines = [
                f"I could not find a {field} doctor at {requested_time}, "
                "but these slots are open:"
            ]
            for option in slots.options[:3]:
                lines.append(
                    f"- Dr. {option.doctor_name}: {', '.join(option.times[:5])}"
                )
            return ClinixAgentOutput(
                content="\n".join(lines),
                intent=ModelIntent.appointment,
                toolCalls=[tool_call],
            )

        return ClinixAgentOutput(
            content=slots.message or f"I could not find open {field} slots that day.",
            intent=ModelIntent.appointment,
            toolCalls=[tool_call],
        )

    async def _confirm_booking(self, agent_input: ClinixAgentInput) -> ClinixAgentOutput:
        if not agent_input.pending_action:
            return ClinixAgentOutput(
                content="I do not have a pending booking to confirm yet.",
                intent=ModelIntent.appointment,
            )

        payload = BookAppointmentInput(
            doctorName=agent_input.pending_action.doctor_name,
            appointmentDate=agent_input.pending_action.appointment_date,
            reason=agent_input.pending_action.reason,
        )
        result = await book_appointment(self.db, payload, agent_input.patient_user_id)
        tool_call = self._tool_call("book_appointment", payload, result)

        if not result.success:
            return ClinixAgentOutput(
                content=result.reason or "I could not book that appointment.",
                intent=ModelIntent.appointment,
                toolCalls=[tool_call],
            )

        return ClinixAgentOutput(
            content=(
                f"Booked. Your appointment ID is {result.appointment_id}. "
                f"You are scheduled with {result.doctor_name} on {result.date} "
                f"at {result.time}."
            ),
            intent=ModelIntent.appointment,
            toolCalls=[tool_call],
        )

    def _with_memory_updates(self, output: ClinixAgentOutput) -> ClinixAgentOutput:
        if output.pending_action:
            output.memory_updates["pendingAction"] = output.pending_action.model_dump(
                by_alias=True,
            )
        else:
            output.memory_updates["clearPendingAction"] = True
        return output

    def _tool_call(self, name: str, payload: object, result: object) -> ToolExecution:
        return ToolExecution(
            name=name,
            arguments=payload.model_dump(by_alias=True),
            result=result.model_dump(by_alias=True),
        )

    def _parse_date(self, value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    def _parse_datetime(self, date_value: str | None, time_value: str | None) -> datetime | None:
        if not date_value or not time_value:
            return None
        try:
            return datetime.fromisoformat(f"{date_value}T{time_value}")
        except ValueError:
            return None

    def _field_from_symptom(self, symptom: str | None) -> str | None:
        return field_from_symptom(symptom)

    def _booking_confirmation_text(self, pending: PendingAction) -> str:
        return (
            f"I can book Dr. {pending.doctor_name} on "
            f"{pending.appointment_date.strftime('%A, %B %d, %Y')} at "
            f"{pending.appointment_date.strftime('%H:%M')} for {pending.reason}. "
            'Reply "yes, book it" to confirm.'
        )

    def _default_response(self, action: str) -> str:
        if action == "greeting":
            return "Hi, I can help you find doctors, check availability, or book appointments."
        if action == "emergency":
            return "This could be urgent. Please contact emergency services or go to the nearest emergency department now."
        if action == "medical_info":
            return "I can share general health information, but I cannot diagnose or prescribe."
        return "Can you share a little more detail?"

    def _is_confirmation(self, message: str) -> bool:
        normalized = message.strip().lower()
        confirmation_phrases = {
            "yes",
            "yes book it",
            "book it",
            "confirm",
            "confirm it",
            "go ahead",
            "schedule it",
            "reserve it",
        }
        return normalized in confirmation_phrases

    def _pending_booking_from_history(self, history: list) -> PendingAction | None:
        for item in reversed(history):
            if item.role.value != "assistant":
                continue

            match = re.search(
                r"I can book Dr\. (?P<doctor>.+?) on (?P<date>.+?) at "
                r"(?P<time>\d{2}:\d{2}) for (?P<reason>.+?)\. Reply",
                item.content,
            )
            if not match:
                continue

            try:
                appointment_day = datetime.strptime(
                    match.group("date"),
                    "%A, %B %d, %Y",
                )
                hour, minute = (int(part) for part in match.group("time").split(":"))
                return PendingAction(
                    action="book_appointment",
                    doctorName=match.group("doctor").strip(),
                    appointmentDate=appointment_day.replace(hour=hour, minute=minute),
                    reason=match.group("reason").strip(),
                )
            except ValueError:
                return None

        return None

    def _booking_was_completed_after_pending(self, history: list) -> bool:
        saw_pending_prompt = False
        for item in reversed(history):
            if item.role.value != "assistant":
                continue
            content = item.content
            if content.startswith("Booked."):
                return True
            if "Reply \"yes, book it\" to confirm" in content:
                saw_pending_prompt = True
                continue
            if saw_pending_prompt:
                return False
        return False

    def _slot_selection_from_history(
        self,
        message: str,
        history: list,
    ) -> ClinixAgentOutput | None:
        offered = self._offered_slots_from_history(history)
        if not offered:
            return None

        selected_time = self._extract_time(message)
        if not selected_time:
            return None

        reason = self._extract_reason(message)
        if not reason:
            return ClinixAgentOutput(
                content="What is the reason for the visit?",
                intent=ModelIntent.appointment,
            )

        normalized_time = self._normalize_time(selected_time)
        option = next(
            (
                item
                for item in offered["options"]
                if normalized_time in item["times"]
            ),
            None,
        )
        if not option:
            return ClinixAgentOutput(
                content=(
                    f"{normalized_time} was not one of the listed open slots. "
                    f"Please choose one of: {', '.join(offered['options'][0]['times'])}."
                ),
                intent=ModelIntent.appointment,
            )

        appointment_day = datetime.strptime(offered["date"], "%A, %B %d, %Y")
        hour, minute = (int(part) for part in normalized_time.split(":"))
        pending = PendingAction(
            action="book_appointment",
            doctorName=option["doctorName"],
            appointmentDate=appointment_day.replace(hour=hour, minute=minute),
            reason=reason,
        )
        return ClinixAgentOutput(
            content=self._booking_confirmation_text(pending),
            intent=ModelIntent.appointment,
            pendingAction=pending,
        )

    def _offered_slots_from_history(self, history: list) -> dict | None:
        for item in reversed(history):
            if item.role.value != "assistant":
                continue
            if "Here are available slots for " not in item.content:
                continue

            date_match = re.search(r"Here are available slots for (.+?):", item.content)
            if not date_match:
                return None

            options = []
            for line in item.content.splitlines():
                match = re.search(
                    r"- Dr\. (?P<doctor>.+?) \((?P<specialty>.+?)\): (?P<times>.+)",
                    line,
                )
                if not match:
                    continue
                times = re.findall(r"\b\d{2}:\d{2}\b", match.group("times"))
                options.append(
                    {
                        "doctorName": match.group("doctor").strip(),
                        "specialty": match.group("specialty").strip(),
                        "times": times,
                    },
                )

            if options:
                return {"date": date_match.group(1).strip(), "options": options}

        return None

    def _extract_time(self, message: str) -> str | None:
        match = re.search(r"\b(\d{1,2}):(\d{2})\s*(am|pm)?\b", message, re.IGNORECASE)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2))
            meridiem = (match.group(3) or "").lower()
            if meridiem == "pm" and hour < 12:
                hour += 12
            if meridiem == "am" and hour == 12:
                hour = 0
            return f"{hour:02d}:{minute:02d}"

        match = re.search(r"\b(\d{1,2})\s*(am|pm)\b", message, re.IGNORECASE)
        if not match:
            return None
        hour = int(match.group(1))
        meridiem = match.group(2).lower()
        if meridiem == "pm" and hour < 12:
            hour += 12
        if meridiem == "am" and hour == 12:
            hour = 0
        return f"{hour:02d}:00"

    def _normalize_time(self, value: str) -> str:
        hour, minute = (int(part) for part in value.split(":"))
        return f"{hour:02d}:{minute:02d}"

    def _extract_reason(self, message: str) -> str | None:
        match = re.search(
            r"(?:reason\s+is|for|because of|about)\s+(.+)$",
            message,
            re.IGNORECASE,
        )
        if match:
            reason = match.group(1).strip(" .,")
            return reason or None

        cleaned = re.sub(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b", "", message, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bthe reason is\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .,")
        return cleaned or None
