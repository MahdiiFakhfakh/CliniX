import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { AssistantTextResponse } from '@/src/core/types/domain';
import { useDraftClinicalTextMutation } from '@/src/features/ai/hooks/useDraftClinicalTextMutation';
import { useCreatePrescriptionMutation } from '@/src/features/doctor/hooks/useCreatePrescriptionMutation';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const prescriptionSchema = z.object({
  medication: z.string().min(2, 'Medication is required'),
  dosage: z.string().min(2, 'Dosage is required'),
  frequency: z.string().min(2, 'Frequency is required'),
  duration: z.string().min(2, 'Duration is required'),
  instructions: z.string().min(5, 'Instructions are required'),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

export function DoctorCreatePrescriptionScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = params.patientId ?? '';

  const createMutation = useCreatePrescriptionMutation(patientId);
  const aiDraftMutation = useDraftClinicalTextMutation();
  const [draft, setDraft] = useState<AssistantTextResponse | null>(null);

  const { control, handleSubmit, setValue, getValues } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        patientId,
        medication: values.medication,
        dosage: values.dosage,
        frequency: values.frequency,
        duration: values.duration,
        instructions: values.instructions,
      });

      Alert.alert('Prescription created', 'The prescription has been saved.');
      router.back();
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  const handleAIDraft = async () => {
    const context = [getValues('medication'), getValues('dosage')].filter(Boolean).join(' | ');

    try {
      const response = await aiDraftMutation.mutateAsync({
        kind: 'prescription',
        patientId,
        context: context || 'Chronic follow-up medication plan',
      });

      setDraft(response);
      setValue('instructions', response.content);
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  };

  return (
    <Screen title="Create Prescription" subtitle="Draft with AI then finalize dosage and instructions.">
      <PrimaryButton
        label={aiDraftMutation.isPending ? 'Generating Draft...' : 'Generate AI Draft'}
        loading={aiDraftMutation.isPending}
        onPress={handleAIDraft}
      />

      {draft ? (
        <Card>
          <Text style={styles.aiTitle}>{draft.title}</Text>
          <Text style={styles.aiBody}>{draft.content}</Text>
          <Text style={styles.aiCaution}>{draft.caution}</Text>
        </Card>
      ) : null}

      <Card>
        <FormTextField control={control} name="medication" label="Medication" placeholder="Drug name" />
        <FormTextField control={control} name="dosage" label="Dosage" placeholder="e.g. 20 mg" />
        <FormTextField control={control} name="frequency" label="Frequency" placeholder="e.g. once daily" />
        <FormTextField control={control} name="duration" label="Duration" placeholder="e.g. 30 days" />
        <FormTextField control={control} name="instructions" label="Instructions" placeholder="Special guidance" />

        <PrimaryButton
          label={createMutation.isPending ? 'Saving...' : 'Save Prescription'}
          loading={createMutation.isPending}
          onPress={onSubmit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aiTitle: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  aiBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  aiCaution: {
    backgroundColor: '#FFF5DD',
    borderRadius: radius.sm,
    color: '#8A6100',
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
});
