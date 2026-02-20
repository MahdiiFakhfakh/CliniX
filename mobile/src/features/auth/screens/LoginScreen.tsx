import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { UserRole } from '@/src/core/types/auth';
import { loginSchema, type LoginFormValues } from '@/src/features/auth/schemas/loginSchema';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { useAuthStore } from '@/src/store/authStore';

const roleOptions: UserRole[] = ['patient', 'doctor'];

export function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const session = useAuthStore((state) => state.session);

  const { control, handleSubmit, watch } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'dr.james.smith@clinix.com',
      password: 'password123',
      role: 'doctor',
    },
    mode: 'onChange',
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (session) {
      router.replace(roleHomePaths[session.user.role]);
    }
  }, [router, session]);

  const onSubmit = handleSubmit(async (values) => {
    clearError();

    try {
      await signIn(values);
      const role = useAuthStore.getState().session?.user.role ?? values.role;
      router.replace(roleHomePaths[role]);
    } catch {
      // Store already contains the error message.
    }
  });

  return (
    <Screen
      title="CliniX Mobile"
      subtitle="Role-based hospital workflows for patients and doctors."
      scroll
    >
      <Card>
        <View style={styles.formBlock}>
          <FormTextField control={control} name="email" label="Email" placeholder="name@clinix.app" keyboardType="email-address" />
          <FormTextField control={control} name="password" label="Password" placeholder="Your password" secureTextEntry />

          <Controller
            control={control}
            name="role"
            render={({ field: { value, onChange } }) => (
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>Role</Text>
                <View style={styles.roleButtonsRow}>
                  {roleOptions.map((role) => {
                    const active = value === role;

                    return (
                      <Pressable
                        key={role}
                        accessibilityRole="button"
                        onPress={() => onChange(role)}
                        style={[styles.roleChip, active && styles.roleChipActive]}
                      >
                        <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{role.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          />

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSubmitting ? 'Signing in...' : `Sign in as ${selectedRole}`}
            loading={isSubmitting}
            onPress={onSubmit}
          />

          <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.demoTitle}>Demo Credentials</Text>
        <Text style={styles.demoLine}>Doctor: dr.james.smith@clinix.com / password123</Text>
        <Text style={styles.demoLine}>Admin (doctor access): admin@clinix.com / password123</Text>
        <Text style={styles.demoLine}>Patient: any seeded patient email / password123</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formBlock: {
    gap: spacing.md,
  },
  roleContainer: {
    gap: spacing.sm,
  },
  roleLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  roleChipTextActive: {
    color: colors.surface,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderColor: colors.danger,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  demoTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  demoLine: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  forgotLink: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
