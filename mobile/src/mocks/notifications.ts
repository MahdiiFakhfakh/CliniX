import type { InAppNotification } from '@/src/core/types/domain';

const isoMinutesAgo = (minutes: number): string => {
  const value = new Date(Date.now() - minutes * 60 * 1000);
  return value.toISOString();
};

export const mockNotifications: InAppNotification[] = [
  {
    id: 'n-1',
    title: 'Appointment Reminder',
    body: 'Your cardiology follow-up starts in 45 minutes.',
    sentAt: isoMinutesAgo(8),
    read: false,
  },
  {
    id: 'n-2',
    title: 'Lab Results Ready',
    body: 'CBC report for patient Hassan Ali is now available.',
    sentAt: isoMinutesAgo(42),
    read: true,
  },
  {
    id: 'n-3',
    title: 'Shift Alert',
    body: 'Emergency bed ER-04 requires urgent reassessment.',
    sentAt: isoMinutesAgo(90),
    read: true,
  },
];
