import { config } from '@/src/core/config/env';
import { sortAppointmentsAscending } from '@/src/features/appointments/utils/appointmentDates';
import { cancelMockAppointment, createMockAppointment, getMockAppointments, updateMockAppointment, } from '@/src/mocks/appointments';
import { apiRequest } from '@/src/services/api/client';
const isAppointmentStatus = (value) => {
    return (value === 'scheduled' ||
        value === 'confirmed' ||
        value === 'completed' ||
        value === 'cancelled' ||
        value === 'in_progress' ||
        value === 'no_show');
};
const mapAppointment = (item, role) => {
    const patientName = (item.patient?.fullName ?? `${item.patient?.firstName ?? ''} ${item.patient?.lastName ?? ''}`.trim()) ||
        'Unknown Patient';
    const doctorName = (item.doctor?.fullName ?? `${item.doctor?.firstName ?? ''} ${item.doctor?.lastName ?? ''}`.trim()) ||
        'Unknown Doctor';
    return {
        id: item._id,
        role,
        patientId: item.patient?._id,
        patientName,
        doctorName,
        department: item.doctor?.specialization ?? 'General Medicine',
        date: item.date,
        time: item.time ?? '09:00 AM',
        status: isAppointmentStatus(item.status) ? item.status : 'scheduled',
        reason: item.reason ?? 'Routine consultation',
        room: item.room ?? 'TBD',
    };
};
export async function fetchAppointments(role) {
    const url = role === 'doctor' ? '/doctors/me/schedule' : '/patients/me/appointments';
    try {
        const response = await apiRequest({
            method: 'GET',
            url,
        });
        if (!response.success || !Array.isArray(response.appointments)) {
            if (!config.enableMockFallback) {
                throw new Error('Invalid appointments response');
            }
            return getMockAppointments(role);
        }
        return sortAppointmentsAscending(response.appointments.map((item) => mapAppointment(item, role)));
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return getMockAppointments(role);
    }
}
export async function bookAppointment(payload) {
    try {
        const response = await apiRequest({
            method: 'POST',
            url: '/appointments',
            data: payload,
        });
        if (!response.success || !response.appointment) {
            if (!config.enableMockFallback) {
                throw new Error('Invalid book appointment response');
            }
            return createMockAppointment(payload);
        }
        return mapAppointment(response.appointment, 'patient');
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return createMockAppointment(payload);
    }
}
export async function updateAppointment(payload) {
    try {
        const response = await apiRequest({
            method: 'PATCH',
            url: `/appointments/${payload.id}`,
            data: {
                date: payload.date,
                time: payload.time,
                reason: payload.reason,
            },
        });
        if (!response.success || !response.appointment) {
            if (!config.enableMockFallback) {
                throw new Error('Invalid update appointment response');
            }
            return updateMockAppointment(payload);
        }
        return mapAppointment(response.appointment, 'patient');
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return updateMockAppointment(payload);
    }
}
export async function cancelAppointment(appointmentId) {
    try {
        const response = await apiRequest({
            method: 'PATCH',
            url: `/appointments/${appointmentId}`,
            data: { status: 'cancelled' },
        });
        if (!response.success || !response.appointment) {
            if (!config.enableMockFallback) {
                throw new Error('Invalid cancel appointment response');
            }
            return cancelMockAppointment(appointmentId);
        }
        return mapAppointment(response.appointment, 'patient');
    }
    catch (error) {
        if (!config.enableMockFallback) {
            throw error;
        }
        return cancelMockAppointment(appointmentId);
    }
}
