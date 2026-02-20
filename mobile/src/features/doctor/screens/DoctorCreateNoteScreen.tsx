import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { AssistantTextResponse } from '@/src/core/types/domain';
import { useDraftClinicalTextMutation } from '@/src/features/ai/hooks/useDraftClinicalTextMutation';
import { useCreateConsultationNoteMutation } from '@/src/features/doctor/hooks/useCreateConsultationNoteMutation';
import { Card } from '@/src/shared/components/Card';
import { FormTextField } from '@/src/shared/components/FormTextField';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

const noteSchema = z.object({
  subjective: z.string().min(10, 'Provide subjective details'),
  objective: z.string().min(10, 'Provide objective findings'),
  assessment: z.string().min(10, 'Provide assessment'),
  plan: z.string().min(10, 'Provide treatment plan'),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export function DoctorCreateNoteScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = params.patientId ?? '';

  const createMutation = useCreateConsultationNoteMutation(patientId);
  const aiDraftMutation = useDraftClinicalTextMutation();
  const [draft, setDraft] = useState<AssistantTextResponse | null>(null);

  const { control, handleSubmit, setValue, getValues } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      subjective: 'Patient states ...',
      objective: 'Vitals and exam findings ...',
      assessment: 'Clinical impression ...',
      plan: 'Treatment and follow-up ...',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        patientId,
        subjective: values.subjective,
        objective: values.objective,
        assessment: values.assessment,
        plan: values.plan,
      });

      Alert.alert('SOAP note saved', 'The note has been added to patient details.');
      router.back();
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  });

  const handleAIDraft = async () => {
    const context = [getValues('subjective'), getValues('objective')].filter(Boolean).join(' | ');

    try {
      const response = await aiDraftMutation.mutateAsync({
        kind: 'consultation-note',
        patientId,
        context: context || 'Follow-up consultation',
      });

      setDraft(response);
      setValue('assessment', response.content);
    } catch {
      // Error toasts are shown globally by query mutation cache.
    }
  };

  return (
    <Screen title="Create Note" subtitle="SOAP template: Subjective, Objective, Assessment, Plan.">
      <Card>
        <Text style={styles.templateTitle}>SOAP Template</Text>
        <Text style={styles.templateLine}>S (Subjective): symptoms and patient narrative.</Text>
        <Text style={styles.templateLine}>O (Objective): exam and measurable findings.</Text>
        <Text style={styles.templateLine}>A (Assessment): clinical diagnosis or impression.</Text>
        <Text style={styles.templateLine}>P (Plan): treatment, orders, and follow-up plan.</Text>
      </Card>

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
        <View style={styles.form}>
          <FormTextField control={control} name="subjective" label="Subjective (S)" placeholder="Patient-reported symptoms" />
          <FormTextField control={control} name="objective" label="Objective (O)" placeholder="Exam findings" />
          <FormTextField control={control} name="assessment" label="Assessment (A)" placeholder="Clinical impression" />
          <FormTextField control={control} name="plan" label="Plan (P)" placeholder="Treatment plan" />

          <PrimaryButton
            label={createMutation.isPending ? 'Saving...' : 'Save SOAP Note'}
            loading={createMutation.isPending}
            onPress={onSubmit}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  templateTitle: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  templateLine: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
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
  form: {
    gap: spacing.md,
  },
});
