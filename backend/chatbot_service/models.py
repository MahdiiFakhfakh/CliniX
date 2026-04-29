from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


MEDICAL_CAUTION = (
    "This AI assistant provides general medical information only. "
    "Always consult a licensed healthcare professional."
)


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


class ModelIntent(str, Enum):
    greeting = "greeting"
    medical_info = "medical_info"
    doctor_search = "doctor_search"
    appointment = "appointment"
    emergency = "emergency"
    unknown = "unknown"


class ConversationMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)

    @field_validator("message")
    @classmethod
    def strip_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message is required")
        return value


class ChatReply(BaseModel):
    content: str
    caution: str = MEDICAL_CAUTION


class ChatResponse(BaseModel):
    success: bool = True
    reply: ChatReply


class HistoryResponse(BaseModel):
    success: bool = True
    messages: list[ConversationMessage]


class ClearHistoryResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str


class PendingAction(BaseModel):
    action: str
    doctor_name: str = Field(alias="doctorName")
    appointment_date: datetime = Field(alias="appointmentDate")
    reason: str

    model_config = ConfigDict(populate_by_name=True)


class ToolExecution(BaseModel):
    name: str
    arguments: dict[str, Any]
    result: dict[str, Any]


class ClinixAgentInput(BaseModel):
    message: str
    patient_user_id: str = Field(alias="patientUserId")
    history: list[ConversationMessage] = Field(default_factory=list)
    pending_action: PendingAction | None = Field(default=None, alias="pendingAction")

    model_config = ConfigDict(populate_by_name=True)


class ClinixAgentOutput(BaseModel):
    content: str
    intent: ModelIntent
    pending_action: PendingAction | None = Field(default=None, alias="pendingAction")
    tool_calls: list[ToolExecution] = Field(default_factory=list, alias="toolCalls")
    memory_updates: dict[str, Any] = Field(default_factory=dict, alias="memoryUpdates")

    model_config = ConfigDict(populate_by_name=True)


class ClinixPlannerOutput(BaseModel):
    intent: ModelIntent = ModelIntent.unknown
    action: str = Field(
        default="clarify",
        description=(
            "One of: greeting, medical_info, list_doctors, check_availability, "
            "prepare_booking, confirm_booking, emergency, clarify."
        ),
    )
    doctor_name: str | None = Field(default=None, alias="doctorName")
    field: str | None = None
    symptom: str | None = None
    date: str | None = Field(
        default=None,
        description="ISO date, for example 2026-04-30.",
    )
    time: str | None = Field(
        default=None,
        description="24-hour time, for example 10:30.",
    )
    reason: str | None = None
    response: str | None = Field(
        default=None,
        description="Short natural-language response for greetings, medical info, or clarifying.",
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("doctor_name", "field", "symptom", "date", "time", "reason", "response")
    @classmethod
    def strip_optional_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class CheckAvailableSlotsInput(BaseModel):
    doctor_name: str = Field(
        ...,
        alias="doctorName",
        min_length=1,
        description="Full name of the doctor the patient wants to see.",
    )
    requested_date: datetime = Field(
        ...,
        alias="requestedDate",
        description="ISO 8601 date and time requested by the patient.",
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("doctor_name")
    @classmethod
    def strip_doctor_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Doctor name is required")
        return value


class CheckAvailableSlotsOutput(BaseModel):
    available: bool
    reason: str | None = None
    doctor_id: str | None = Field(default=None, alias="doctorId")
    doctor_name: str | None = Field(default=None, alias="doctorName")
    requested_date: datetime | None = Field(default=None, alias="requestedDate")
    requested_time: str | None = Field(default=None, alias="requestedTime")

    model_config = ConfigDict(populate_by_name=True)


class DoctorSummary(BaseModel):
    doctor_id: str = Field(alias="doctorId")
    doctor_name: str = Field(alias="doctorName")
    specialization: str
    department: str | None = None
    status: str | None = None
    consultation_fee: float | int | None = Field(default=None, alias="consultationFee")
    experience: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class ListDoctorsInput(BaseModel):
    field: str | None = Field(
        default=None,
        description="Medical specialization or department, for example Cardiology.",
    )
    limit: int = Field(default=5, ge=1, le=20)

    @field_validator("field")
    @classmethod
    def strip_field(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ListDoctorsOutput(BaseModel):
    success: bool = True
    field: str | None = None
    doctors: list[DoctorSummary] = Field(default_factory=list)
    message: str | None = None


class GetAvailableSlotsInput(BaseModel):
    requested_date: datetime = Field(
        ...,
        alias="requestedDate",
        description="Date to search for available appointment slots.",
    )
    doctor_name: str | None = Field(
        default=None,
        alias="doctorName",
        description="Doctor name to search slots for.",
    )
    field: str | None = Field(
        default=None,
        description="Medical specialization or department to search slots for.",
    )
    limit: int = Field(default=5, ge=1, le=20)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def require_doctor_or_field(self) -> "GetAvailableSlotsInput":
        if not self.doctor_name and not self.field:
            raise ValueError("doctorName or field is required")
        return self

    @field_validator("doctor_name", "field")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class DoctorSlotOptions(BaseModel):
    doctor_id: str = Field(alias="doctorId")
    doctor_name: str = Field(alias="doctorName")
    specialization: str
    date: str
    times: list[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class GetAvailableSlotsOutput(BaseModel):
    success: bool = True
    requested_date: datetime = Field(alias="requestedDate")
    doctor_name: str | None = Field(default=None, alias="doctorName")
    field: str | None = None
    options: list[DoctorSlotOptions] = Field(default_factory=list)
    message: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class BookAppointmentInput(BaseModel):
    doctor_name: str = Field(
        ...,
        alias="doctorName",
        min_length=1,
        description="Full name of the doctor.",
    )
    appointment_date: datetime = Field(
        ...,
        alias="appointmentDate",
        description="ISO 8601 date and time for the appointment.",
    )
    reason: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Brief reason for the visit.",
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("doctor_name", "reason")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value


class BookAppointmentOutput(BaseModel):
    success: bool
    reason: str | None = None
    appointment_id: str | None = Field(default=None, alias="appointmentId")
    doctor_name: str | None = Field(default=None, alias="doctorName")
    date: str | None = None
    time: str | None = None

    model_config = ConfigDict(populate_by_name=True)


ToolResult = (
    CheckAvailableSlotsOutput
    | ListDoctorsOutput
    | GetAvailableSlotsOutput
    | BookAppointmentOutput
    | dict[str, Any]
)
