const ACTIVE_STATUSES = new Set(['scheduled', 'confirmed', 'in_progress']);
const CLOSED_STATUSES = new Set(['completed', 'cancelled', 'no_show']);

const parseTimeParts = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) {
        return null;
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes > 59) {
        return null;
    }

    if (meridiem) {
        if (hours < 1 || hours > 12) {
            return null;
        }
        if (meridiem === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (meridiem === 'AM' && hours === 12) {
            hours = 0;
        }
    }
    else if (hours > 23) {
        return null;
    }

    return { hours, minutes };
};

export const getAppointmentDateTime = (appointment) => {
    const date = new Date(appointment?.date);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const time = parseTimeParts(appointment?.time);
    if (!time) {
        return date;
    }

    const combined = new Date(date);
    combined.setHours(time.hours, time.minutes, 0, 0);
    return combined;
};

export const isCancelledAppointment = (appointment) => appointment?.status === 'cancelled';

export const isPastAppointment = (appointment, now = new Date()) => {
    if (isCancelledAppointment(appointment)) {
        return false;
    }

    if (CLOSED_STATUSES.has(appointment?.status)) {
        return true;
    }

    const date = getAppointmentDateTime(appointment);
    return Boolean(date) && date.getTime() < now.getTime();
};

export const isUpcomingAppointment = (appointment, now = new Date()) => {
    if (!ACTIVE_STATUSES.has(appointment?.status)) {
        return false;
    }

    const date = getAppointmentDateTime(appointment);
    return Boolean(date) && date.getTime() >= now.getTime();
};

export const sortAppointmentsAscending = (appointments) => {
    return [...appointments].sort((a, b) => {
        const first = getAppointmentDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const second = getAppointmentDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return first - second;
    });
};
