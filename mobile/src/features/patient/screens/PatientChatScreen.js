import React from 'react';
import { useAuthStore } from '@/src/store/authStore';
export function PatientChatScreen() {
    const senderName = useAuthStore((state) => state.session?.user.profile.fullName ?? 'Patient');
}
