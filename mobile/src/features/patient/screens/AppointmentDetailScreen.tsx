import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { AppointmentCard } from '@/src/features/appointments/components/AppointmentCard';
import { useAppointmentsQuery } from '@/src/features/appointments/hooks/useAppointmentsQuery';
import { useCancelAppointmentMutation } from '@/src/features/appointments/hooks/useCancelAppointmentMutation';
import { useUpdateAppointmentMutation } from '@/src/features/appointments/hooks/useUpdateAppointmentMutation';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const updateSchema = z.object({
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Use ISO date format',
  }),
  time: z.string().min(3, 'Time is required'),
  reason: z.string().min(5, 'Reason is required'),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export function AppointmentDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId: string }>();
  const appointmentId = params.appointmentId ?? '';

  const appointmentsQuery = useAppointmentsQuery('patient');
  const updateMutation = useUpdateAppointmentMutation();
  const cancelMutation = useCancelAppointmentMutation();

  const appointment = appointmentsQuery.data?.find((item) => item.id === appointmentId);

  const { control, handleSubmit, reset } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      date: appointment?.date ?? new Date().toISOString(),
      time: appointment?.time ?? '09:00 AM',
      reason: appointment?.reason ?? '',
    },
  });

  useEffect(() => {
    if (appointment) {
      reset({
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
      });
    }
  }, [appointment, reset]);

  const onSave = handleSubmit(async (values) => {
    if (!appointmentId) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: appointmentId,
        date: values.date,
        time: values.time,
        reason: values.reason,
      });

      Alert.alert('Appointment updated', 'The appointment details were saved.');
      router.back();
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  const onCancel = async () => {
    if (!appointmentId) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(appointmentId);
      Alert.alert('Appointment cancelled', 'The appointment has been cancelled.');
      router.back();
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  };

  if (appointmentsQuery.isLoading) {
    return (
      <Screen title="Appointment Details" subtitle="Loading details..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen title="Appointment Details" subtitle="Appointment not found.">
        <EmptyState title="Not found" subtitle="This appointment may have been removed." />
      </Screen>
    );
  }

  return (
    <Screen title="Appointment Details" subtitle="Review and update your appointment.">
      <AppointmentCard appointment={appointment} />

      <Card>
        <Text style={styles.formTitle}>Modify Appointment</Text>
        <View style={styles.form}>
          <FormTextField control={control} name="date" label="Date" placeholder="2026-03-01T10:00:00.000Z" />
          <FormTextField control={control} name="time" label="Time" placeholder="10:30 AM" />
          <FormTextField control={control} name="reason" label="Reason" placeholder="Reason for visit" />
          <PrimaryButton
            label={updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            loading={updateMutation.isPending}
            onPress={onSave}
          />
          <PrimaryButton
            label={cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
            loading={cancelMutation.isPending}
            onPress={onCancel}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.sm,
  },
});
