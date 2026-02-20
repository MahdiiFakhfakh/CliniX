import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  UpdateProfilePayload,
  UserRole,
} from '@/src/core/types/auth';

type DemoUser = {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  department?: string;
  phone?: string;
};

let demoUsers: DemoUser[] = [
  {
    id: 'u-patient-1',
    email: 'patient@clinix.app',
    password: 'Test1234',
    role: 'patient',
    fullName: 'Mariam Hassan',
    phone: '+1 555-0101',
  },
  {
    id: 'u-doctor-1',
    email: 'doctor@clinix.app',
    password: 'Test1234',
    role: 'doctor',
    fullName: 'Dr. Kareem Adel',
    department: 'Cardiology',
    phone: '+1 555-0119',
  },
  {
    id: 'u-nurse-1',
    email: 'nurse@clinix.app',
    password: 'Test1234',
    role: 'nurse',
    fullName: 'Nurse Salma Noor',
    department: 'Emergency',
    phone: '+1 555-0177',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  await delay(450);

  const user = demoUsers.find(
    (item) =>
      item.email.toLowerCase() === payload.email.toLowerCase().trim() &&
      item.password === payload.password &&
      item.role === payload.role,
  );

  if (!user) {
    throw new Error('Invalid credentials. Use one of the demo users shown on login.');
  }

  return {
    token: `mock-token-${user.role}-${user.id}`,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        fullName: user.fullName,
        department: user.department,
        phone: user.phone,
      },
    },
  };
}

export async function mockForgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  await delay(450);

  const exists = demoUsers.some((item) => item.email.toLowerCase() === payload.email.toLowerCase().trim());
  if (!exists) {
    return { message: 'If this email exists, a reset link has been sent.' };
  }

  return { message: 'Password reset instructions have been sent to your email.' };
}

export async function mockUpdateProfile(
  userId: string,
  currentRole: UserRole,
  payload: UpdateProfilePayload,
): Promise<LoginResponse['user']> {
  await delay(350);

  demoUsers = demoUsers.map((item) => {
    if (item.id !== userId) {
      return item;
    }

    return {
      ...item,
      email: payload.email ?? item.email,
      fullName: payload.fullName,
      phone: payload.phone ?? item.phone,
      department: payload.department ?? item.department,
      role: currentRole,
    };
  });

  const next = demoUsers.find((item) => item.id === userId);
  if (!next) {
    throw new Error('Unable to update profile');
  }

  return {
    id: next.id,
    email: next.email,
    role: next.role,
    profile: {
      fullName: next.fullName,
      department: next.department,
      phone: next.phone,
    },
  };
}
