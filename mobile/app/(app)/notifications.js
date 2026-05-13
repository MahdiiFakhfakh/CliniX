import { Redirect } from 'expo-router';
import React from 'react';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { useAuthStore } from '@/src/store/authStore';

export default function NotificationsRoute() {
    const session = useAuthStore((state) => state.session);
    return <Redirect href={session ? roleHomePaths[session.user.role] : '/(auth)/login'} />;
}
