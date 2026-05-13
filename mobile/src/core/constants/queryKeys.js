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
    chat: {
        thread: (role) => ['chat-thread', role],
    },
    doctor: {
        alerts: ['doctor-alerts'],
        patients: ['doctor-patients'],
        patientDetail: (patientId) => ['doctor-patient-detail', patientId],
    },
    nursePatients: {
        list: ['nurse-patients'],
    },
    notifications: {
        list: ['notifications'],
    },
};
