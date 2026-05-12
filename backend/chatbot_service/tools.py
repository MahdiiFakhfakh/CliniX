from datetime import datetime
import random
import re
import time
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from .models import (
    BookAppointmentInput,
    BookAppointmentOutput,
    CheckAvailableSlotsInput,
    CheckAvailableSlotsOutput,
    DoctorSlotOptions,
    DoctorSummary,
    GetAvailableSlotsInput,
    GetAvailableSlotsOutput,
    ListDoctorsInput,
    ListDoctorsOutput,
    ToolResult,
)


def _local_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone().replace(tzinfo=None)


def _clean_doctor_name(value: str) -> str:
    return re.sub(r"^Dr\.?\s*", "", value, flags=re.IGNORECASE).strip()


def _appointment_id() -> str:
    return f"APT{int(time.time() * 1000)}{random.randint(0, 999)}"


def _doctor_summary(doctor: dict[str, Any]) -> DoctorSummary:
    return DoctorSummary(
        doctorId=str(doctor["_id"]),
        doctorName=doctor.get("fullName", "Unknown doctor"),
        specialization=doctor.get("specialization", "General Medicine"),
        department=doctor.get("department"),
        status=doctor.get("status"),
        experience=doctor.get("experience"),
    )


def _doctor_search_query(fields: list[str]) -> dict[str, Any]:
    filters: list[dict[str, Any]] = []
    for field in fields:
        escaped = re.escape(field)
        filters.extend(
            [
                {"specialization": {"$regex": escaped, "$options": "i"}},
                {"department": {"$regex": escaped, "$options": "i"}},
            ],
        )

    if not filters:
        return {}
    return {"$or": filters}


def _doctor_field_priority(doctor: dict[str, Any], fields: list[str]) -> int:
    specialization = str(doctor.get("specialization") or "").lower()
    department = str(doctor.get("department") or "").lower()
    for index, field in enumerate(fields):
        field = field.lower()
        if field in specialization or field in department:
            return index
    return len(fields)


def _doctor_sort_key(doctor: dict[str, Any], fields: list[str]) -> tuple[int, int, float, int]:
    status_rank = 0 if doctor.get("status") == "available" else 1
    rating = float((doctor.get("ratings") or {}).get("average") or 0)
    experience = int(doctor.get("experience") or 0)
    return (
        _doctor_field_priority(doctor, fields),
        status_rank,
        -rating,
        -experience,
    )


def _time_to_minutes(value: str | None) -> int | None:
    if not value or ":" not in value:
        return None

    hours, minutes = value.split(":", 1)
    try:
        return int(hours) * 60 + int(minutes)
    except ValueError:
        return None


def _minutes_to_time(value: int) -> str:
    return f"{value // 60:02d}:{value % 60:02d}"


def _day_bounds(value: datetime) -> tuple[datetime, datetime]:
    day_start = value.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = value.replace(hour=23, minute=59, second=59, microsecond=999000)
    return day_start, day_end


def _doctor_is_scheduled(doctor: dict[str, Any], requested: datetime) -> bool:
    availability = doctor.get("availability") or []
    if not availability:
        return True

    requested_day = requested.strftime("%A").lower()
    requested_minutes = requested.hour * 60 + requested.minute
    for slot in availability:
        if slot.get("day") != requested_day or slot.get("isAvailable") is False:
            continue

        start = _time_to_minutes(slot.get("startTime"))
        end = _time_to_minutes(slot.get("endTime"))
        if start is None or end is None:
            continue
        if start <= requested_minutes < end:
            return True

    return False


async def _doctor_slots_for_day(
    db: AsyncIOMotorDatabase,
    doctor: dict[str, Any],
    requested: datetime,
) -> list[str]:
    if doctor.get("status") and doctor.get("status") != "available":
        return []

    requested_day = requested.strftime("%A").lower()
    day_start, day_end = _day_bounds(requested)
    appointments = await db.appointments.find(
        {
            "doctor": doctor["_id"],
            "date": {"$gte": day_start, "$lte": day_end},
            "status": {"$nin": ["cancelled", "no_show"]},
        },
        {"time": 1},
    ).to_list(length=None)
    booked_times = {appointment.get("time") for appointment in appointments}

    slots: list[str] = []
    for availability in doctor.get("availability") or []:
        if availability.get("day") != requested_day:
            continue
        if availability.get("isAvailable") is False:
            continue

        start = _time_to_minutes(availability.get("startTime"))
        end = _time_to_minutes(availability.get("endTime"))
        if start is None or end is None or start >= end:
            continue

        for slot in range(start, end, 30):
            slot_time = _minutes_to_time(slot)
            if slot_time not in booked_times:
                slots.append(slot_time)

    return sorted(set(slots))


async def _find_doctor(db: AsyncIOMotorDatabase, doctor_name: str) -> dict[str, Any] | None:
    clean_name = _clean_doctor_name(doctor_name)
    if not clean_name:
        return None

    parts = [part for part in clean_name.split() if part]

    filters: list[dict[str, Any]] = [
        {"fullName": {"$regex": re.escape(clean_name), "$options": "i"}},
    ]
    if parts:
        filters.append({"firstName": {"$regex": re.escape(parts[0]), "$options": "i"}})
    if len(parts) > 1:
        filters.append(
            {
                "lastName": {
                    "$regex": re.escape(" ".join(parts[1:])),
                    "$options": "i",
                },
            },
        )

    return await db.doctors.find_one({"$or": filters})


async def list_doctors(
    db: AsyncIOMotorDatabase,
    payload: ListDoctorsInput,
) -> ListDoctorsOutput:
    fields = [payload.field, *payload.related_fields] if payload.field else payload.related_fields
    fields = [field for field in fields if field]
    query = _doctor_search_query(fields)

    raw_doctors = await db.doctors.find(query).to_list(length=None)
    if fields:
        raw_doctors.sort(key=lambda doctor: _doctor_sort_key(doctor, fields))
    else:
        raw_doctors.sort(key=lambda doctor: _doctor_sort_key(doctor, []))

    doctors = [_doctor_summary(doctor) for doctor in raw_doctors[: payload.limit]]
    if not doctors:
        return ListDoctorsOutput(
            success=True,
            field=payload.field,
            doctors=[],
            message=(
                f"No doctors found for {payload.field}."
                if payload.field
                else "No doctors found."
            ),
        )

    return ListDoctorsOutput(success=True, field=payload.field, doctors=doctors)


async def get_available_slots(
    db: AsyncIOMotorDatabase,
    payload: GetAvailableSlotsInput,
) -> GetAvailableSlotsOutput:
    requested = _local_naive(payload.requested_date)
    doctors: list[dict[str, Any]] = []

    if payload.doctor_name:
        doctor = await _find_doctor(db, payload.doctor_name)
        if doctor:
            doctors = [doctor]
    elif payload.field:
        doctors_result = await list_doctors(
            db,
            ListDoctorsInput(field=payload.field, limit=payload.limit),
        )
        doctor_ids = [ObjectId(doctor.doctor_id) for doctor in doctors_result.doctors]
        if doctor_ids:
            doctors = await db.doctors.find({"_id": {"$in": doctor_ids}}).to_list(
                length=payload.limit,
            )

    options: list[DoctorSlotOptions] = []
    for doctor in doctors:
        times = await _doctor_slots_for_day(db, doctor, requested)
        if not times:
            continue
        options.append(
            DoctorSlotOptions(
                doctorId=str(doctor["_id"]),
                doctorName=doctor.get("fullName", "Unknown doctor"),
                specialization=doctor.get("specialization", "General Medicine"),
                date=requested.strftime("%Y-%m-%d"),
                times=times[:8],
            ),
        )

    label = payload.doctor_name or payload.field
    if not doctors:
        return GetAvailableSlotsOutput(
            requestedDate=payload.requested_date,
            doctorName=payload.doctor_name,
            field=payload.field,
            options=[],
            message=f"No doctors found for {label}.",
        )

    if not options:
        return GetAvailableSlotsOutput(
            requestedDate=payload.requested_date,
            doctorName=payload.doctor_name,
            field=payload.field,
            options=[],
            message=(
                f"No open slots found for {label} on "
                f"{requested.strftime('%A, %B %d, %Y')}."
            ),
        )

    return GetAvailableSlotsOutput(
        requestedDate=payload.requested_date,
        doctorName=payload.doctor_name,
        field=payload.field,
        options=options,
    )


async def check_available_slots(
    db: AsyncIOMotorDatabase,
    payload: CheckAvailableSlotsInput,
) -> CheckAvailableSlotsOutput:
    doctor = await _find_doctor(db, payload.doctor_name)
    if not doctor:
        return CheckAvailableSlotsOutput(
            available=False,
            reason=f'No doctor named "{payload.doctor_name}" found in the system.',
        )

    requested = _local_naive(payload.requested_date)
    day_start, day_end = _day_bounds(requested)
    requested_time = requested.strftime("%H:%M")
    doctor_name = doctor.get("fullName", payload.doctor_name)

    if doctor.get("status") and doctor.get("status") != "available":
        return CheckAvailableSlotsOutput(
            available=False,
            reason=f"Dr. {doctor_name} is currently marked as {doctor.get('status')}.",
        )

    if not _doctor_is_scheduled(doctor, requested):
        return CheckAvailableSlotsOutput(
            available=False,
            reason=f"Dr. {doctor_name} is not scheduled for that day and time.",
        )

    conflict = await db.appointments.find_one(
        {
            "doctor": doctor["_id"],
            "date": {"$gte": day_start, "$lte": day_end},
            "time": requested_time,
            "status": {"$nin": ["cancelled", "no_show"]},
        },
    )

    if conflict:
        return CheckAvailableSlotsOutput(
            available=False,
            reason=(
                f"Dr. {doctor_name} already has an appointment on that day "
                f"at {requested_time}."
            ),
        )

    return CheckAvailableSlotsOutput(
        available=True,
        doctorId=str(doctor["_id"]),
        doctorName=doctor_name,
        requestedDate=payload.requested_date,
        requestedTime=requested_time,
    )


async def book_appointment(
    db: AsyncIOMotorDatabase,
    payload: BookAppointmentInput,
    patient_user_id: str,
) -> BookAppointmentOutput:
    doctor = await _find_doctor(db, payload.doctor_name)
    if not doctor:
        return BookAppointmentOutput(
            success=False,
            reason=f'Doctor "{payload.doctor_name}" not found.',
        )

    patient = await db.patients.find_one({"user": ObjectId(patient_user_id)})
    if not patient:
        return BookAppointmentOutput(success=False, reason="Patient profile not found.")

    availability = await check_available_slots(
        db,
        CheckAvailableSlotsInput(
            doctorName=payload.doctor_name,
            requestedDate=payload.appointment_date,
        ),
    )
    if not availability.available:
        return BookAppointmentOutput(success=False, reason=availability.reason)

    appointment_at = _local_naive(payload.appointment_date)
    date_only = appointment_at.replace(hour=0, minute=0, second=0, microsecond=0)
    appointment_time = appointment_at.strftime("%H:%M")
    appointment = {
        "appointmentId": _appointment_id(),
        "patient": patient["_id"],
        "doctor": doctor["_id"],
        "date": date_only,
        "time": appointment_time,
        "duration": 30,
        "type": "consultation",
        "reason": payload.reason,
        "symptoms": [],
        "status": "scheduled",
        "reminderSent": False,
        "createdBy": ObjectId(patient_user_id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    insert_result = await db.appointments.insert_one(appointment)
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {
            "$addToSet": {"appointments": insert_result.inserted_id},
            "$set": {"nextAppointment": date_only, "updatedAt": datetime.utcnow()},
        },
    )
    await db.doctors.update_one(
        {"_id": doctor["_id"]},
        {
            "$addToSet": {
                "appointments": insert_result.inserted_id,
                "patients": patient["_id"],
            },
            "$set": {"updatedAt": datetime.utcnow()},
        },
    )

    return BookAppointmentOutput(
        success=True,
        appointmentId=appointment["appointmentId"],
        doctorName=doctor.get("fullName", payload.doctor_name),
        date=date_only.strftime("%a %b %d %Y"),
        time=appointment_time,
        reason=payload.reason,
    )


async def execute_tool(
    db: AsyncIOMotorDatabase,
    tool_name: str,
    raw_arguments: dict[str, Any],
    patient_user_id: str,
) -> ToolResult:
    try:
        if tool_name == "check_available_slots":
            payload = CheckAvailableSlotsInput.model_validate(raw_arguments)
            return await check_available_slots(db, payload)

        if tool_name == "list_doctors":
            payload = ListDoctorsInput.model_validate(raw_arguments)
            return await list_doctors(db, payload)

        if tool_name == "get_available_slots":
            payload = GetAvailableSlotsInput.model_validate(raw_arguments)
            return await get_available_slots(db, payload)

        if tool_name == "book_appointment":
            payload = BookAppointmentInput.model_validate(raw_arguments)
            return await book_appointment(db, payload, patient_user_id)
    except ValidationError as exc:
        return {"error": "Invalid tool arguments", "details": exc.errors()}

    return {"error": f'Unknown tool "{tool_name}"'}


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "check_available_slots",
            "description": (
                "Check whether a doctor is free at a requested appointment date "
                "and time."
            ),
            "parameters": CheckAvailableSlotsInput.model_json_schema(by_alias=True),
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_doctors",
            "description": "List doctors from the CliniX database by specialty or department.",
            "parameters": ListDoctorsInput.model_json_schema(by_alias=True),
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_slots",
            "description": "Return open appointment time slots for a doctor or specialty on a date.",
            "parameters": GetAvailableSlotsInput.model_json_schema(by_alias=True),
        },
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": (
                "Book a confirmed appointment for the authenticated patient with "
                "the specified doctor."
            ),
            "parameters": BookAppointmentInput.model_json_schema(by_alias=True),
        },
    },
]
