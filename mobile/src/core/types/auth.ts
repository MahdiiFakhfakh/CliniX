export type UserRole = 'patient' | 'doctor' | 'nurse';

export interface UserProfile {
  fullName: string;
  department?: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse extends AuthSession {}

export interface ForgotPasswordPayload {
  email: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  department?: string;
  email?: string;
}

export const isUserRole = (value: string): value is UserRole => {
  return value === 'patient' || value === 'doctor' || value === 'nurse';
};
