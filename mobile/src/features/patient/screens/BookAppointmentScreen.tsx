import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useBookAppointmentMutation } from '@/src/features/appointments/hooks/useBookAppointmentMutation';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { scheduleLocalNotification } from '@/src/services/notifications/notificationsService';
import { usePreferencesStore } from '@/src/store/preferencesStore';

const specialtyDoctors: Record<string, string[]> = {
  Cardiology: ['Dr. Kareem Adel', 'Dr. Salma Farouk'],
  Dermatology: ['Dr. Lina Maher', 'Dr. Omar Fahmy'],
  Orthopedics: ['Dr. Tamer Hassan', 'Dr. Nouran Ali'],
  Pediatrics: ['Dr. Rania Khaled', 'Dr. Youssef Said'],
};

const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM'];

const bookingSchema = z.object({
  specialty: z.string().min(2, 'Select a specialty'),
  doctorName: z.string().min(3, 'Select a doctor'),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Use ISO date format',
  }),
  time: z.string().min(3, 'Select a time slot'),
  reason: z.string().min(5, 'Please add a short reason'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;
type Step = 1 | 2 | 3 | 4;

export function BookAppointmentScreen(): React.JSX.Element {
  const router = useRouter();
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const mutation = useBookAppointmentMutation();

  const [step, setStep] = useState<Step>(1);

  const { control, handleSubmit, setValue, watch, trigger } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      specialty: '',
      doctorName: '',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: '',
      reason: 'Follow-up checkup',
    },
  });

  const selectedSpecialty = watch('specialty');
  const selectedDoctor = watch('doctorName');
  const selectedDate = watch('date');
  const selectedTime = watch('time');
  const reason = watch('reason');

  const doctors = useMemo(() => specialtyDoctors[selectedSpecialty] ?? [], [selectedSpecialty]);

  const goNext = async () => {
    if (step === 1) {
      const valid = await trigger('specialty');
      if (valid) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      const valid = await trigger('doctorName');
      if (valid) {
        setStep(3);
      }
      return;
    }

    if (step === 3) {
      const valid = await trigger(['date', 'time', 'reason']);
      if (valid) {
        setStep(4);
      }
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const onConfirm = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        department: values.specialty,
        doctorName: values.doctorName,
        date: values.date,
        time: values.time,
        reason: values.reason,
      });

      if (notificationsEnabled) {
        await scheduleLocalNotification({
          title: 'Appointment Confirmed',
          body: `${values.specialty} with ${values.doctorName} at ${values.time}`,
          secondsFromNow: 8,
        });
      }

      Alert.alert('Appointment booked', 'Your appointment has been confirmed.');
      router.replace('/(app)/(patient)/appointments');
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  return (
    <Screen
      title="Book Appointment"
      subtitle="Step-by-step flow: specialty, doctor, date/time, then confirm."
    >
      <Card>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Specialty</Text>
            <Controller
              control={control}
              name="specialty"
              render={({ fieldState: { error } }) => (
                <>
                  <View style={styles.optionGrid}>
                    {Object.keys(specialtyDoctors).map((specialty) => {
                      const active = specialty === selectedSpecialty;
                      return (
                        <Pressable
                          key={specialty}
                          onPress={() => {
                            setValue('specialty', specialty, { shouldValidate: true });
                            setValue('doctorName', '', { shouldValidate: false });
                          }}
                          style={[styles.optionChip, active && styles.optionChipActive]}
                        >
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>{specialty}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
                </>
              )}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Doctor</Text>
            <Controller
              control={control}
              name="doctorName"
              render={({ fieldState: { error } }) => (
                <>
                  <View style={styles.optionGrid}>
                    {doctors.map((doctor) => {
                      const active = doctor === selectedDoctor;
                      return (
                        <Pressable
                          key={doctor}
                          onPress={() => setValue('doctorName', doctor, { shouldValidate: true })}
                          style={[styles.optionChip, active && styles.optionChipActive]}
                        >
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>{doctor}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
                </>
              )}
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            <FormTextField control={control} name="date" label="Date" placeholder="2026-03-01T10:00:00.000Z" />

            <Controller
              control={control}
              name="time"
              render={({ fieldState: { error } }) => (
                <>
                  <Text style={styles.inputLabel}>Time Slot</Text>
                  <View style={styles.optionGrid}>
                    {timeSlots.map((slot) => {
                      const active = slot === selectedTime;
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => setValue('time', slot, { shouldValidate: true })}
                          style={[styles.optionChip, active && styles.optionChipActive]}
                        >
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>{slot}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
                </>
              )}
            />

            <FormTextField control={control} name="reason" label="Reason" placeholder="Why are you visiting?" />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirm Appointment</Text>
            <Text style={styles.summaryLine}>Specialty: {selectedSpecialty}</Text>
            <Text style={styles.summaryLine}>Doctor: {selectedDoctor}</Text>
            <Text style={styles.summaryLine}>Date: {new Date(selectedDate).toDateString()}</Text>
            <Text style={styles.summaryLine}>Time: {selectedTime}</Text>
            <Text style={styles.summaryLine}>Reason: {reason}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.actionsRow}>
        {step > 1 ? <PrimaryButton label="Back" onPress={goBack} /> : null}
        {step < 4 ? (
          <PrimaryButton label="Next" onPress={goNext} />
        ) : (
          <PrimaryButton
            label={mutation.isPending ? 'Confirming...' : 'Confirm Appointment'}
            loading={mutation.isPending}
            onPress={onConfirm}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  optionGrid: {
    gap: spacing.sm,
  },
  optionChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.surface,
  },
  inputLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  summaryLine: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  actionsRow: {
    gap: spacing.sm,
  },
});
