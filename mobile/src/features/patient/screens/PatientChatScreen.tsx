import React from 'react';

import { RoleMessagingScreen } from '@/src/features/messaging/screens/RoleMessagingScreen';
import { useAuthStore } from '@/src/store/authStore';

export function PatientChatScreen(): React.JSX.Element {
  const senderName = useAuthStore((state) => state.session?.user.profile.fullName ?? 'Patient');

  return (
    <RoleMessagingScreen
      role="patient"
      senderName={senderName}
      title="Chat With Doctor"
      subtitle="Discuss symptoms and follow-up questions securely."
    />
  );
}
