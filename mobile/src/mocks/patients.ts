import type { PatientSummary } from '@/src/core/types/domain';

const isoMinutesAgo = (minutes: number): string => {
  const value = new Date(Date.now() - minutes * 60 * 1000);
  return value.toISOString();
};

export const mockNursePatients: PatientSummary[] = [
  {
    id: 'p-101',
    fullName: 'Hassan Ali',
    age: 63,
    bedNumber: 'ER-12',
    condition: 'Hypertension monitoring',
    riskLevel: 'medium',
    updatedAt: isoMinutesAgo(6),
  },
  {
    id: 'p-102',
    fullName: 'Laila Samir',
    age: 39,
    bedNumber: 'ER-04',
    condition: 'Post-op observation',
    riskLevel: 'high',
    updatedAt: isoMinutesAgo(3),
  },
  {
    id: 'p-103',
    fullName: 'Ramy Nabil',
    age: 25,
    bedNumber: 'ER-08',
    condition: 'Fracture pain management',
    riskLevel: 'low',
    updatedAt: isoMinutesAgo(15),
  },
  {
    id: 'p-104',
    fullName: 'Sara Fouad',
    age: 55,
    bedNumber: 'ER-10',
    condition: 'Asthma treatment',
    riskLevel: 'medium',
    updatedAt: isoMinutesAgo(11),
  },
];
