import React from 'react';
import { useAuthStore } from '@/src/store/authStore';
export function DoctorChatScreen() {
    const senderName = useAuthStore((state) => state.session?.user.profile.fullName ?? 'Doctor');
}
