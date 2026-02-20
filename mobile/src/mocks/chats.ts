import type { ChatMessage, ChatSendPayload } from '@/src/core/types/domain';
import type { UserRole } from '@/src/core/types/auth';

const isoMinutesAgo = (minutes: number): string => {
  const value = new Date(Date.now() - minutes * 60 * 1000);
  return value.toISOString();
};

const threadIdByRole: Record<UserRole, string> = {
  patient: 'thread-patient-doctor',
  doctor: 'thread-doctor-patients',
  nurse: 'thread-nurse-team',
};

let messagesStore: ChatMessage[] = [
  {
    id: 'msg-1',
    threadId: 'thread-patient-doctor',
    senderRole: 'doctor',
    senderName: 'Dr. Kareem Adel',
    body: 'Good morning. Please share how your symptoms changed after medication.',
    sentAt: isoMinutesAgo(85),
    encrypted: true,
  },
  {
    id: 'msg-2',
    threadId: 'thread-patient-doctor',
    senderRole: 'patient',
    senderName: 'Mariam Hassan',
    body: 'Chest tightness improved, only mild discomfort after stairs.',
    sentAt: isoMinutesAgo(70),
    encrypted: true,
  },
  {
    id: 'msg-3',
    threadId: 'thread-doctor-patients',
    senderRole: 'patient',
    senderName: 'Youssef Fathi',
    body: 'Can we move my appointment to tomorrow afternoon?',
    sentAt: isoMinutesAgo(30),
    encrypted: true,
  },
  {
    id: 'msg-4',
    threadId: 'thread-doctor-patients',
    senderRole: 'doctor',
    senderName: 'Dr. Kareem Adel',
    body: 'Yes, I have moved it to 3:00 PM tomorrow.',
    sentAt: isoMinutesAgo(20),
    encrypted: true,
  },
];

export function getMockChatMessages(role: UserRole): ChatMessage[] {
  const threadId = threadIdByRole[role];
  return messagesStore
    .filter((item) => item.threadId === threadId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    .map((item) => ({ ...item }));
}

export function getMockThreadId(role: UserRole): string {
  return threadIdByRole[role];
}

export function addMockChatMessage(payload: ChatSendPayload): ChatMessage {
  const created: ChatMessage = {
    id: `msg-${Math.random().toString(16).slice(2, 8)}`,
    threadId: payload.threadId,
    senderRole: payload.role,
    senderName: payload.senderName,
    body: payload.body,
    sentAt: new Date().toISOString(),
    encrypted: true,
  };

  messagesStore = [...messagesStore, created];
  return { ...created };
}
