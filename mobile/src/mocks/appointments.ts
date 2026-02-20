import type {
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  UpdateAppointmentPayload,
} from '@/src/core/types/domain';
import type { UserRole } from '@/src/core/types/auth';

const isoDay = (offset: number): string => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString();
};

const baseAppointments: Appointment[] = [
  {
    id: 'appt-1',
    role: 'patient',
    patientId: 'p-self',
    patientName: 'Mariam Hassan',
    doctorName: 'Dr. Kareem Adel',
    department: 'Cardiology',
    date: isoDay(1),
    time: '10:30 AM',
    status: 'confirmed',
    reason: 'Chest pain follow-up',
    room: 'A-201',
  },
  {
    id: 'appt-2',
    role: 'patient',
    patientId: 'p-self',
    patientName: 'Mariam Hassan',
    doctorName: 'Dr. Lina Maher',
    department: 'Dermatology',
    date: isoDay(5),
    time: '02:00 PM',
    status: 'scheduled',
    reason: 'Skin rash review',
    room: 'B-105',
  },
  {
    id: 'appt-3',
    role: 'doctor',
    patientId: 'p-201',
    patientName: 'Youssef Fathi',
    doctorName: 'Dr. Kareem Adel',
    department: 'Cardiology',
    date: isoDay(0),
    time: '11:00 AM',
    status: 'in_progress',
    reason: 'ECG interpretation',
    room: 'A-204',
  },
  {
    id: 'appt-4',
    role: 'doctor',
    patientId: 'p-202',
    patientName: 'Nadia Tarek',
    doctorName: 'Dr. Kareem Adel',
    department: 'Cardiology',
    date: isoDay(2),
    time: '09:00 AM',
    status: 'scheduled',
    reason: 'Post-op checkup',
    room: 'A-205',
  },
  {
    id: 'appt-5',
    role: 'nurse',
    patientId: 'p-203',
    patientName: 'Omar Mahmoud',
    doctorName: 'Dr. Salim Amin',
    department: 'Emergency',
    date: isoDay(0),
    time: '01:30 PM',
    status: 'confirmed',
    reason: 'Wound care',
    room: 'ER-07',
  },
  {
    id: 'appt-6',
    role: 'nurse',
    patientId: 'p-204',
    patientName: 'Farah Mohamed',
    doctorName: 'Dr. Salim Amin',
    department: 'Emergency',
    date: isoDay(0),
    time: '04:00 PM',
    status: 'scheduled',
    reason: 'Medication administration',
    room: 'ER-10',
  },
];

let mockAppointmentStore: Appointment[] = [...baseAppointments];

function copyAppointments(appointments: Appointment[]): Appointment[] {
  return appointments.map((item) => ({ ...item }));
}

export function getMockAppointments(role: UserRole): Appointment[] {
  if (role === 'patient') {
    return copyAppointments(mockAppointmentStore.filter((item) => item.role === 'patient'));
  }

  if (role === 'doctor') {
    return copyAppointments(mockAppointmentStore.filter((item) => item.role === 'doctor'));
  }

  return copyAppointments(mockAppointmentStore.filter((item) => item.role === 'nurse'));
}

export function createMockAppointment(input: BookAppointmentPayload): Appointment {
  const statuses: AppointmentStatus[] = ['scheduled', 'confirmed'];
  const created: Appointment = {
    id: `appt-${Math.random().toString(16).slice(2, 8)}`,
    role: 'patient',
    patientId: 'p-self',
    patientName: 'Mariam Hassan',
    doctorName: input.doctorName,
    department: input.department,
    date: input.date,
    time: input.time,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    reason: input.reason,
    room: 'A-210',
  };

  mockAppointmentStore = [created, ...mockAppointmentStore];
  return created;
}

export function updateMockAppointment(payload: UpdateAppointmentPayload): Appointment {
  let updatedAppointment: Appointment | null = null;

  mockAppointmentStore = mockAppointmentStore.map((item) => {
    if (item.id !== payload.id) {
      return item;
    }

    updatedAppointment = {
      ...item,
      date: payload.date ?? item.date,
      time: payload.time ?? item.time,
      reason: payload.reason ?? item.reason,
    };

    return updatedAppointment;
  });

  if (!updatedAppointment) {
    throw new Error('Appointment not found');
  }

  return updatedAppointment;
}

export function cancelMockAppointment(appointmentId: string): Appointment {
  let updatedAppointment: Appointment | null = null;

  mockAppointmentStore = mockAppointmentStore.map((item) => {
    if (item.id !== appointmentId) {
      return item;
    }

    updatedAppointment = {
      ...item,
      status: 'cancelled',
    };

    return updatedAppointment;
  });

  if (!updatedAppointment) {
    throw new Error('Appointment not found');
  }

  return updatedAppointment;
}

export function resetMockAppointments(): void {
  mockAppointmentStore = [...baseAppointments];
}
