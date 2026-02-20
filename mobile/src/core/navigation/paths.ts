import type { UserRole } from '@/src/core/types/auth';

export const roleHomePaths: Record<UserRole, '/(app)/(patient)/home' | '/(app)/(doctor)/dashboard' | '/(auth)/login'> = {
  patient: '/(app)/(patient)/home',
  doctor: '/(app)/(doctor)/dashboard',
  nurse: '/(auth)/login',
};
