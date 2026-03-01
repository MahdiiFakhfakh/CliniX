import React from 'react';
import { RoleMessagingScreen } from '@/src/features/messaging/screens/RoleMessagingScreen';
import { useAuthStore } from '@/src/store/authStore';
export function DoctorChatScreen() {
    const senderName = useAuthStore((state) => state.session?.user.profile.fullName ?? 'Doctor');
    return (<RoleMessagingScreen role="doctor" senderName={senderName} title="Messages" subtitle="Secure channel for patient communication."/>);
}
