import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import {
  profileSchema,
  type ProfileFormValues,
} from '@/src/features/profile/schemas/profileSchema';
import { useAuthStore } from '@/src/store/authStore';

export function ProfileScreen({ subtitle }: { subtitle?: string }): React.JSX.Element {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const saveProfile = useAuthStore((state) => state.saveProfile);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const [isEditing, setIsEditing] = useState(false);

  const defaults = useMemo(
    () => ({
      fullName: session?.user.profile.fullName ?? '',
      email: session?.user.email ?? '',
      phone: session?.user.profile.phone ?? '',
      department: session?.user.profile.department ?? '',
    }),
    [session],
  );

  const { control, handleSubmit, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const onSave = handleSubmit(async (values) => {
    await saveProfile({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      department: values.department || undefined,
    });

    setIsEditing(false);
    Alert.alert('Profile updated', 'Your profile details were saved successfully.');
  });

  return (
    <Screen
      title="Profile"
      subtitle={subtitle ?? 'View and edit your account details.'}
    >
      {!isEditing ? (
        <Card>
          <Text style={styles.name}>{session?.user.profile.fullName ?? 'CliniX User'}</Text>
          <Text style={styles.detail}>Email: {session?.user.email ?? 'N/A'}</Text>
          <Text style={styles.detail}>Role: {session?.user.role ?? 'N/A'}</Text>
          <Text style={styles.detail}>Phone: {session?.user.profile.phone ?? 'N/A'}</Text>
          <Text style={styles.detail}>Department: {session?.user.profile.department ?? 'N/A'}</Text>
        </Card>
      ) : null}

      {isEditing ? (
        <Card>
          <View style={styles.form}>
            <FormTextField control={control} name="fullName" label="Full Name" placeholder="Your full name" />
            <FormTextField control={control} name="email" label="Email" placeholder="name@clinix.app" keyboardType="email-address" />
            <FormTextField control={control} name="phone" label="Phone" placeholder="Phone number" />
            <FormTextField control={control} name="department" label="Department" placeholder="Department" />
            <PrimaryButton
              label={isSubmitting ? 'Saving...' : 'Save Profile'}
              loading={isSubmitting}
              onPress={onSave}
            />
            <PrimaryButton
              label="Cancel"
              onPress={() => {
                reset(defaults);
                setIsEditing(false);
              }}
            />
          </View>
        </Card>
      ) : (
        <View style={styles.actions}>
          <PrimaryButton label="Edit Profile" onPress={() => setIsEditing(true)} />
          <PrimaryButton label="Open Settings" onPress={() => router.push('/(app)/settings')} />
          <PrimaryButton label="View Notifications" onPress={() => router.push('/(app)/notifications')} />
        </View>
      )}

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>Security</Text>
        <Text style={styles.helpText}>Profile updates are saved to secure session storage and synced to API when available.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  detail: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  helpBox: {
    backgroundColor: '#EFF5FF',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  helpTitle: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  helpText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
