import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useRequestLabMutation } from '@/src/features/doctor/hooks/useRequestLabMutation';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const labRequestSchema = z.object({
  kind: z.enum(['lab', 'imaging']),
  name: z.string().min(3, 'Study/test name required'),
  clinicalQuestion: z.string().min(10, 'Clinical question required'),
  priority: z.enum(['routine', 'urgent']),
});

type LabRequestFormValues = z.infer<typeof labRequestSchema>;

export function DoctorRequestLabScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = params.patientId ?? '';

  const requestMutation = useRequestLabMutation(patientId);

  const { control, handleSubmit } = useForm<LabRequestFormValues>({
    resolver: zodResolver(labRequestSchema),
    defaultValues: {
      kind: 'lab',
      name: '',
      clinicalQuestion: '',
      priority: 'routine',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await requestMutation.mutateAsync({
        patientId,
        kind: values.kind,
        name: values.name,
        clinicalQuestion: values.clinicalQuestion,
        priority: values.priority,
      });

      Alert.alert('Request created', 'Lab/imaging request submitted.');
      router.back();
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  return (
    <Screen title="Create Lab/Imaging Order" subtitle="Create diagnostic orders with urgency and clinical question.">
      <Card>
        <Controller
          control={control}
          name="kind"
          render={({ field: { value, onChange } }) => (
            <View style={styles.optionSection}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.optionRow}>
                {(['lab', 'imaging'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[styles.optionChip, value === option && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, value === option && styles.optionChipTextActive]}>
                      {option.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <FormTextField control={control} name="name" label="Test / Study Name" placeholder="e.g. MRI Brain" />
        <FormTextField
          control={control}
          name="clinicalQuestion"
          label="Clinical Question"
          placeholder="What should this test answer?"
        />

        <Controller
          control={control}
          name="priority"
          render={({ field: { value, onChange } }) => (
            <View style={styles.optionSection}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.optionRow}>
                {(['routine', 'urgent'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[styles.optionChip, value === option && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, value === option && styles.optionChipTextActive]}>
                      {option.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <PrimaryButton
          label={requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          loading={requestMutation.isPending}
          onPress={onSubmit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  optionSection: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: colors.surface,
  },
});
