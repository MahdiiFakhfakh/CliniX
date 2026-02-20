import type { AxiosRequestConfig } from 'axios';

import { isUserRole, type UpdateProfilePayload, type UserRole } from '@/src/core/types/auth';
import type {
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  ChatSendPayload,
  ConsultationNotePayload,
  DraftAssistantPayload,
  ExplainResultPayload,
  LabRequestPayload,
  PrescriptionPayload,
  UpdateAppointmentPayload,
} from '@/src/core/types/domain';
import { mockAIChat, mockDraftClinicalText, mockExplainResult } from '@/src/mocks/ai';
import {
  cancelMockAppointment,
  createMockAppointment,
  getMockAppointments,
  updateMockAppointment,
} from '@/src/mocks/appointments';
import { mockForgotPassword, mockLogin, mockUpdateProfile } from '@/src/mocks/auth';
import { addMockChatMessage, getMockChatMessages, getMockThreadId } from '@/src/mocks/chats';
import { mockNotifications } from '@/src/mocks/notifications';
import {
  addMockConsultationNote,
  addMockLabRequest,
  addMockPrescription,
  getMockDoctorAlerts,
  getMockDoctorPatientDetail,
  getMockDoctorPatients,
  getMockLabResults,
  getMockMedicalSummary,
  getMockPatientProfile,
  getMockPrescriptions,
} from '@/src/mocks/records';

type Identity = {
  role: UserRole;
  userId: string;
};

type PathParams = Record<string, string>;

type MockRequestContext = {
  method: string;
  path: string;
  params: Record<string, unknown>;
  body: unknown;
  identity: Identity;
};

type MockServerError = Error & { statusCode?: number };

const LATENCY_MS = 180;

const defaultIdentity: Identity = {
  role: 'patient',
  userId: 'u-patient-1',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockError(message: string, statusCode: number): never {
  const error = new Error(message) as MockServerError;
  error.name = 'MockServerError';
  error.statusCode = statusCode;
  throw error;
}

function normalizeMethod(method?: string): string {
  return (method ?? 'GET').toUpperCase();
}

function normalizePath(rawUrl?: string): string {
  const path = new URL(rawUrl ?? '/', 'http://mock.local').pathname;

  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

function extractQueryParams(rawUrl?: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const url = new URL(rawUrl ?? '/', 'http://mock.local');

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

function parseIdentity(token: string | null): Identity {
  if (!token) {
    return defaultIdentity;
  }

  const match = token.match(/^mock-token-(patient|doctor|nurse)-(.+)$/);
  if (!match) {
    return defaultIdentity;
  }

  const [, role, userId] = match;

  if (!isUserRole(role)) {
    return defaultIdentity;
  }

  return { role, userId };
}

function inferRoleFromEmail(email: string): UserRole {
  const value = email.toLowerCase();

  if (value.includes('doctor')) {
    return 'doctor';
  }

  if (value.includes('nurse')) {
    return 'nurse';
  }

  return 'patient';
}

function mapRiskToStatus(riskLevel: 'low' | 'medium' | 'high'): 'active' | 'pending' | 'inactive' {
  if (riskLevel === 'high') {
    return 'inactive';
  }

  if (riskLevel === 'medium') {
    return 'pending';
  }

  return 'active';
}

function mapStatusToRisk(status?: string): 'low' | 'medium' | 'high' {
  if (status === 'inactive' || status === 'critical') {
    return 'high';
  }

  if (status === 'pending') {
    return 'medium';
  }

  return 'low';
}

function toBackendAppointment(appointment: Appointment) {
  return {
    _id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    reason: appointment.reason,
    room: appointment.room,
    patient: {
      _id: appointment.patientId,
      fullName: appointment.patientName,
    },
    doctor: {
      fullName: appointment.doctorName,
      specialization: appointment.department,
    },
  };
}

function toBackendPatientItem(patientId: string) {
  const detail = getMockDoctorPatientDetail(patientId);
  const profile = detail.profile;

  return {
    _id: profile.id,
    fullName: profile.fullName,
    age: profile.age,
    gender: profile.gender,
    phone: profile.phone,
    email: profile.email,
    patientId: profile.patientId,
    status: mapRiskToStatus(
      getMockDoctorPatients().find((item) => item.id === patientId)?.riskLevel ?? 'low',
    ),
    updatedAt: new Date().toISOString(),
  };
}

function buildThreadTitle(role: UserRole): string {
  if (role === 'doctor') {
    return 'Patient Messages';
  }

  if (role === 'nurse') {
    return 'Nursing Team';
  }

  return 'Dr. Kareem Adel';
}

function resolveRoleFromThreadId(threadId: string, fallback: UserRole): UserRole {
  if (threadId === getMockThreadId('patient')) {
    return 'patient';
  }

  if (threadId === getMockThreadId('doctor')) {
    return 'doctor';
  }

  if (threadId === getMockThreadId('nurse')) {
    return 'nurse';
  }

  return fallback;
}

function getThreadMessagesById(threadId: string, fallbackRole: UserRole) {
  const role = resolveRoleFromThreadId(threadId, fallbackRole);
  return getMockChatMessages(role).filter((item) => item.threadId === threadId);
}

function buildThreadList(role: UserRole) {
  const threadId = getMockThreadId(role);
  const messages = getThreadMessagesById(threadId, role);
  const lastMessage = messages[messages.length - 1];

  return [
    {
      id: threadId,
      title: buildThreadTitle(role),
      unreadCount: role === 'doctor' ? messages.filter((item) => item.senderRole === 'patient').length : 0,
      lastMessagePreview: lastMessage?.body ?? 'No messages yet.',
      lastMessageAt: lastMessage?.sentAt ?? new Date().toISOString(),
    },
  ];
}

function matchPath(path: string, pattern: string): PathParams | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  const params: PathParams = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const currentPattern = patternParts[index];
    const currentPath = pathParts[index];

    if (currentPattern.startsWith(':')) {
      params[currentPattern.slice(1)] = decodeURIComponent(currentPath);
      continue;
    }

    if (currentPattern !== currentPath) {
      return null;
    }
  }

  return params;
}

function ensureObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object') {
    return value as T;
  }

  return fallback;
}

function parseAppointmentStatus(value: unknown): AppointmentStatus | null {
  if (
    value === 'scheduled' ||
    value === 'confirmed' ||
    value === 'completed' ||
    value === 'cancelled' ||
    value === 'in_progress' ||
    value === 'no_show'
  ) {
    return value;
  }

  return null;
}

async function handleAuthRoutes(context: MockRequestContext): Promise<unknown> {
  const { method, path, body, identity } = context;

  if (method === 'POST' && path === '/auth/login') {
    const payload = ensureObject<Partial<{ email: string; password: string; role: UserRole }>>(body, {});
    const email = (payload.email ?? '').trim();
    const password = payload.password ?? '';
    const role = payload.role && isUserRole(payload.role) ? payload.role : inferRoleFromEmail(email);

    if (!email || !password) {
      return createMockError('Email and password are required.', 400);
    }

    const session = await mockLogin({ email, password, role });

    return {
      success: true,
      token: session.token,
      refreshToken: `mock-refresh-${session.user.role}-${session.user.id}`,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        profile: session.user.profile,
      },
    };
  }

  if (method === 'POST' && path === '/auth/refresh') {
    return {
      success: true,
      token: `mock-token-${identity.role}-${identity.userId}`,
      refreshToken: `mock-refresh-${identity.role}-${identity.userId}`,
    };
  }

  if (method === 'POST' && path === '/auth/forgot-password') {
    const payload = ensureObject<Partial<{ email: string }>>(body, {});

    if (!payload.email) {
      return createMockError('Email is required.', 400);
    }

    const response = await mockForgotPassword({ email: payload.email });
    return { success: true, message: response.message };
  }

  if (method === 'PUT' && path === '/auth/profile') {
    const payload = ensureObject<Partial<UpdateProfilePayload>>(body, {});

    if (!payload.fullName || !payload.fullName.trim()) {
      return createMockError('Full name is required.', 400);
    }

    const updatedUser = await mockUpdateProfile(identity.userId, identity.role, {
      fullName: payload.fullName,
      phone: payload.phone,
      department: payload.department,
      email: payload.email,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
      },
    };
  }

  if (method === 'GET' && path === '/auth/me') {
    if (identity.role === 'patient') {
      const profile = getMockPatientProfile();

      return {
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          role: 'patient',
          profile: {
            fullName: profile.fullName,
            phone: profile.phone,
          },
        },
      };
    }

    return {
      success: true,
      user: {
        id: identity.userId,
        email: `${identity.role}@clinix.app`,
        role: identity.role,
        profile: {
          fullName: identity.role === 'doctor' ? 'Dr. Kareem Adel' : 'Nurse Salma Noor',
          department: identity.role === 'doctor' ? 'Cardiology' : 'Emergency',
          phone: identity.role === 'doctor' ? '+1 555-0119' : '+1 555-0177',
        },
      },
    };
  }

  return null;
}

async function handlePatientAndDoctorRoutes(
  context: MockRequestContext,
  pathParams: PathParams | null,
): Promise<unknown> {
  const { method, path, body, params } = context;

  if (method === 'GET' && path === '/patients/me') {
    return {
      success: true,
      patient: getMockPatientProfile(),
      summary: getMockMedicalSummary(),
    };
  }

  if (method === 'GET' && path === '/patients/me/appointments') {
    return {
      success: true,
      appointments: getMockAppointments('patient').map(toBackendAppointment),
    };
  }

  if (method === 'GET' && path === '/doctors/me/schedule') {
    return {
      success: true,
      appointments: getMockAppointments('doctor').map(toBackendAppointment),
    };
  }

  if (method === 'POST' && path === '/appointments') {
    const payload = ensureObject<Partial<BookAppointmentPayload>>(body, {});

    if (!payload.doctorName || !payload.date || !payload.time || !payload.reason || !payload.department) {
      return createMockError('Invalid appointment payload.', 400);
    }

    const appointment = createMockAppointment({
      doctorName: payload.doctorName,
      date: payload.date,
      time: payload.time,
      reason: payload.reason,
      department: payload.department,
    });

    return {
      success: true,
      appointment: toBackendAppointment(appointment),
    };
  }

  const appointmentMatch = matchPath(path, '/appointments/:id');
  if (appointmentMatch && method === 'PATCH') {
    const payload = ensureObject<Partial<UpdateAppointmentPayload & { status?: AppointmentStatus }>>(body, {});

    const incomingStatus = parseAppointmentStatus(payload.status);
    const appointment =
      incomingStatus === 'cancelled'
        ? cancelMockAppointment(appointmentMatch.id)
        : updateMockAppointment({
            id: appointmentMatch.id,
            date: payload.date,
            time: payload.time,
            reason: payload.reason,
          });

    return {
      success: true,
      appointment: toBackendAppointment(appointment),
    };
  }

  if (method === 'GET' && path === '/patients/me/results') {
    return {
      success: true,
      results: getMockLabResults(),
    };
  }

  if (method === 'GET' && path === '/patients/me/prescriptions') {
    return {
      success: true,
      prescriptions: getMockPrescriptions(),
    };
  }

  if (method === 'GET' && path === '/doctors/me/patients') {
    return {
      success: true,
      patients: getMockDoctorPatients().map((item) => ({
        _id: item.id,
        fullName: item.fullName,
        age: item.age,
        condition: item.condition,
        status: mapRiskToStatus(item.riskLevel),
        updatedAt: item.lastVisit,
      })),
    };
  }

  const patientRoute = matchPath(path, '/patients/:id');
  if (patientRoute && method === 'GET') {
    const detail = getMockDoctorPatientDetail(patientRoute.id);

    return {
      success: true,
      patient: toBackendPatientItem(patientRoute.id),
      detail,
    };
  }

  const noteRoute = matchPath(path, '/patients/:id/notes');
  if (noteRoute && method === 'POST') {
    const payload = ensureObject<Partial<ConsultationNotePayload>>(body, {});
    const note = addMockConsultationNote({
      patientId: noteRoute.id,
      subjective: payload.subjective ?? 'Subjective notes pending.',
      objective: payload.objective ?? 'Objective findings pending.',
      assessment: payload.assessment ?? 'Assessment pending.',
      plan: payload.plan ?? 'Plan pending.',
    });

    return { success: true, note };
  }

  const prescriptionRoute = matchPath(path, '/patients/:id/prescriptions');
  if (prescriptionRoute && method === 'POST') {
    const payload = ensureObject<Partial<PrescriptionPayload>>(body, {});
    const prescription = addMockPrescription({
      patientId: prescriptionRoute.id,
      medication: payload.medication ?? 'Medication pending',
      dosage: payload.dosage ?? 'Dose pending',
      frequency: payload.frequency ?? 'Frequency pending',
      duration: payload.duration ?? 'Duration pending',
      instructions: payload.instructions ?? 'Instructions pending',
    });

    return { success: true, prescription };
  }

  const orderRoute = matchPath(path, '/patients/:id/orders');
  if (orderRoute && method === 'POST') {
    const payload = ensureObject<Partial<LabRequestPayload>>(body, {});
    const order = addMockLabRequest({
      patientId: orderRoute.id,
      kind: payload.kind === 'imaging' ? 'imaging' : 'lab',
      name: payload.name ?? 'Order name pending',
      clinicalQuestion: payload.clinicalQuestion ?? 'Clinical question pending',
      priority: payload.priority === 'urgent' ? 'urgent' : 'routine',
    });

    return { success: true, result: order };
  }

  if (method === 'GET' && path === '/patient/summary') {
    return {
      success: true,
      summary: getMockMedicalSummary(),
    };
  }

  if (method === 'GET' && path === '/results') {
    const patientId = typeof params.patientId === 'string' ? params.patientId : undefined;

    return {
      success: true,
      results: getMockLabResults(patientId),
    };
  }

  if (method === 'GET' && path === '/admin/prescriptions') {
    const patientId = typeof params.patientId === 'string' ? params.patientId : undefined;

    return {
      success: true,
      prescriptions: getMockPrescriptions(patientId),
    };
  }

  if (method === 'GET' && path === '/admin/patients') {
    return {
      success: true,
      patients: getMockDoctorPatients().map((item) => ({
        _id: item.id,
        fullName: item.fullName,
        age: item.age,
        condition: item.condition,
        status: mapRiskToStatus(item.riskLevel),
        updatedAt: item.lastVisit,
      })),
    };
  }

  if (pathParams && method === 'GET' && path.startsWith('/admin/patients/')) {
    return {
      success: true,
      patient: toBackendPatientItem(pathParams.id),
    };
  }

  if (method === 'POST' && path === '/doctor/consultation-notes') {
    const payload = ensureObject<Partial<ConsultationNotePayload>>(body, {});
    const note = addMockConsultationNote({
      patientId: payload.patientId ?? 'p-self',
      subjective: payload.subjective ?? 'Subjective notes pending.',
      objective: payload.objective ?? 'Objective findings pending.',
      assessment: payload.assessment ?? 'Assessment pending.',
      plan: payload.plan ?? 'Plan pending.',
    });

    return { success: true, note };
  }

  if (method === 'POST' && path === '/doctor/prescriptions') {
    const payload = ensureObject<Partial<PrescriptionPayload>>(body, {});
    const prescription = addMockPrescription({
      patientId: payload.patientId ?? 'p-self',
      medication: payload.medication ?? 'Medication pending',
      dosage: payload.dosage ?? 'Dose pending',
      frequency: payload.frequency ?? 'Frequency pending',
      duration: payload.duration ?? 'Duration pending',
      instructions: payload.instructions ?? 'Instructions pending',
    });

    return { success: true, prescription };
  }

  if (method === 'POST' && path === '/doctor/lab-requests') {
    const payload = ensureObject<Partial<LabRequestPayload>>(body, {});
    const result = addMockLabRequest({
      patientId: payload.patientId ?? 'p-self',
      kind: payload.kind === 'imaging' ? 'imaging' : 'lab',
      name: payload.name ?? 'Order name pending',
      clinicalQuestion: payload.clinicalQuestion ?? 'Clinical question pending',
      priority: payload.priority === 'urgent' ? 'urgent' : 'routine',
    });

    return { success: true, result };
  }

  if (method === 'GET' && path === '/doctor/alerts') {
    return { success: true, alerts: getMockDoctorAlerts() };
  }

  return null;
}

async function handleMessagingRoutes(context: MockRequestContext): Promise<unknown> {
  const { method, path, body, identity, params } = context;

  if (method === 'GET' && path === '/threads') {
    return {
      success: true,
      threads: buildThreadList(identity.role),
    };
  }

  const threadMessagesRoute = matchPath(path, '/threads/:id/messages');
  if (threadMessagesRoute && method === 'GET') {
    return {
      success: true,
      messages: getThreadMessagesById(threadMessagesRoute.id, identity.role),
    };
  }

  if (threadMessagesRoute && method === 'POST') {
    const payload = ensureObject<Partial<ChatSendPayload>>(body, {});
    const senderRole = payload.role && isUserRole(payload.role) ? payload.role : identity.role;
    const senderName =
      payload.senderName ??
      (senderRole === 'doctor' ? 'Dr. Kareem Adel' : senderRole === 'nurse' ? 'Nurse Salma Noor' : 'Mariam Hassan');
    const messageBody = payload.body?.trim() ?? '';

    if (!messageBody) {
      return createMockError('Message body is required.', 400);
    }

    const message = addMockChatMessage({
      threadId: threadMessagesRoute.id,
      role: senderRole,
      senderName,
      body: messageBody,
    });

    return {
      success: true,
      message,
    };
  }

  if (method === 'GET' && path === '/chat/messages') {
    const threadId =
      typeof params.threadId === 'string' && params.threadId.trim()
        ? params.threadId
        : getMockThreadId(identity.role);

    return {
      success: true,
      messages: getThreadMessagesById(threadId, identity.role),
    };
  }

  if (method === 'POST' && path === '/chat/messages') {
    const payload = ensureObject<Partial<ChatSendPayload>>(body, {});

    if (!payload.threadId) {
      return createMockError('Thread id is required.', 400);
    }

    const senderRole = payload.role && isUserRole(payload.role) ? payload.role : identity.role;
    const message = addMockChatMessage({
      threadId: payload.threadId,
      role: senderRole,
      senderName: payload.senderName ?? 'Care Team',
      body: payload.body ?? '',
    });

    return {
      success: true,
      message,
    };
  }

  return null;
}

async function handleNotificationAndAIRoutes(context: MockRequestContext): Promise<unknown> {
  const { method, path, body } = context;

  if (method === 'GET' && path === '/notifications') {
    return {
      success: true,
      notifications: mockNotifications,
    };
  }

  if (method === 'POST' && path === '/ai/explain-result') {
    const payload = ensureObject<Partial<ExplainResultPayload>>(body, {});

    return {
      success: true,
      explanation: mockExplainResult({
        resultId: payload.resultId ?? 'res-unknown',
        patientQuestion: payload.patientQuestion ?? 'Explain this result.',
      }),
    };
  }

  if (method === 'POST' && path === '/ai/draft') {
    const payload = ensureObject<Partial<DraftAssistantPayload>>(body, {});

    return {
      success: true,
      draft: mockDraftClinicalText({
        kind: payload.kind === 'prescription' ? 'prescription' : 'consultation-note',
        patientId: payload.patientId ?? 'p-self',
        context: payload.context ?? 'General follow-up',
      }),
    };
  }

  if (method === 'POST' && path === '/ai/chat') {
    const payload = ensureObject<
      Partial<{
        role: UserRole;
        messages: Array<{ role: 'user' | 'assistant'; content: string }>;
        patientContext?: string;
      }>
    >(body, {});

    return {
      success: true,
      reply: mockAIChat({
        role: payload.role && isUserRole(payload.role) ? payload.role : 'patient',
        messages:
          payload.messages?.map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content ?? '',
          })) ?? [],
        patientContext: payload.patientContext,
      }),
    };
  }

  return null;
}

export async function mockApiRequest<T>(requestConfig: AxiosRequestConfig, token: string | null): Promise<T> {
  const context: MockRequestContext = {
    method: normalizeMethod(requestConfig.method),
    path: normalizePath(requestConfig.url),
    params: {
      ...extractQueryParams(requestConfig.url),
      ...(ensureObject<Record<string, unknown>>(requestConfig.params, {})),
    },
    body: parseBody(requestConfig.data),
    identity: parseIdentity(token),
  };

  const adminPatientRouteParams = matchPath(context.path, '/admin/patients/:id');

  await delay(LATENCY_MS);

  const authResponse = await handleAuthRoutes(context);
  if (authResponse !== null) {
    return authResponse as T;
  }

  const careResponse = await handlePatientAndDoctorRoutes(context, adminPatientRouteParams);
  if (careResponse !== null) {
    return careResponse as T;
  }

  const messagingResponse = await handleMessagingRoutes(context);
  if (messagingResponse !== null) {
    return messagingResponse as T;
  }

  const auxResponse = await handleNotificationAndAIRoutes(context);
  if (auxResponse !== null) {
    return auxResponse as T;
  }

  return createMockError(`Mock route not found for ${context.method} ${context.path}`, 404);
}

export function asApiClientError(error: unknown): Error {
  if (!error || typeof error !== 'object') {
    return new Error('Unexpected mock server error');
  }

  const mockError = error as MockServerError;
  const normalized = new Error(mockError.message || 'Unexpected mock server error') as MockServerError;
  normalized.statusCode = mockError.statusCode;
  return normalized;
}

export function mapMockStatusToRisk(status?: string): 'low' | 'medium' | 'high' {
  return mapStatusToRisk(status);
}
