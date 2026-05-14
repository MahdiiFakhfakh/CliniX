export const queryKeys = {
    appointments: {
        list: (role) => ['appointments', role],
    },
    doctors: {
        list: ['doctors'],
    },
    patient: {
        profile: ['patient-profile'],
        medicalSummary: ['patient-medical-summary'],
    },
    prescriptions: {
        list: (patientId) => ['prescriptions', patientId ?? 'self'],
    },
    results: {
        list: (patientId) => ['results', patientId ?? 'self'],
    },
    doctor: {
        alerts: ['doctor-alerts'],
        patients: ['doctor-patients'],
        patientDetail: (patientId) => ['doctor-patient-detail', patientId],
    },
    notifications: {
        list: ['notifications'],
    },
};
