import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { forgotPassword } from '@/src/services/api/endpoints/authApi';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/src/features/auth/schemas/forgotPasswordSchema';

export function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: forgotPassword,
  });

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: 'patient@clinix.app',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await mutation.mutateAsync(values);
      Alert.alert('Check your email', response.message);
      router.replace('/(auth)/login');
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  return (
    <Screen title="Forgot Password" subtitle="Enter your email to receive password reset instructions.">
      <Card>
        <View style={styles.form}>
          <FormTextField
            control={control}
            name="email"
            label="Email"
            placeholder="name@clinix.app"
            keyboardType="email-address"
          />
          <PrimaryButton
            label={mutation.isPending ? 'Sending...' : 'Send Reset Link'}
            loading={mutation.isPending}
            onPress={onSubmit}
          />
        </View>
      </Card>

      <Text style={styles.note}>For demo mode, any known account returns a success message.</Text>
      <PrimaryButton label="Back to Login" onPress={() => router.replace('/(auth)/login')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
});
