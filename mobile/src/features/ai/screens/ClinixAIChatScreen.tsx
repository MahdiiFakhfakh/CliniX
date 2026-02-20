import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import type { ClinixAIMessage, ClinixAIMessageRole } from '@/src/core/types/domain';
import { useClinixAIChatMutation } from '@/src/features/ai/hooks/useClinixAIChatMutation';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { clearAIChatMessages, loadAIChatMessages, saveAIChatMessages } from '@/src/services/storage/aiChatStorage';

const chatInputSchema = z.object({
  prompt: z.string().trim().min(4, 'Enter at least 4 characters'),
  patientContext: z.string().trim().max(500, 'Keep context within 500 characters'),
});

type ChatInputValues = z.infer<typeof chatInputSchema>;

type ClinixAIChatScreenProps = {
  role: 'patient' | 'doctor';
  title: string;
  subtitle: string;
};

function createMessage(role: ClinixAIMessageRole, content: string): ClinixAIMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

const defaultCautionByRole: Record<'patient' | 'doctor', string> = {
  patient: 'AI guidance is informational and cannot replace a licensed clinician.',
  doctor: 'AI output is draft support only. Final clinical responsibility remains with the treating doctor.',
};

export function ClinixAIChatScreen({ role, title, subtitle }: ClinixAIChatScreenProps): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user.id;
  const userRole = session?.user.role;
  const chatMutation = useClinixAIChatMutation();
  const [messages, setMessages] = useState<ClinixAIMessage[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [usePatientContext, setUsePatientContext] = useState(true);
  const [typingTick, setTypingTick] = useState(0);
  const [latestCaution, setLatestCaution] = useState(defaultCautionByRole[role]);

  const { control, handleSubmit, reset, setValue, watch } = useForm<ChatInputValues>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      prompt: '',
      patientContext: '',
    },
  });

  const promptValue = watch('prompt');

  useEffect(() => {
    if (!chatMutation.isPending) {
      setTypingTick(0);
      return;
    }

    const timer = setInterval(() => {
      setTypingTick((prev) => prev + 1);
    }, 360);

    return () => clearInterval(timer);
  }, [chatMutation.isPending]);

  useEffect(() => {
    if (!userId || userRole !== role) {
      setMessages([]);
      setIsHydrating(false);
      return;
    }

    let active = true;

    setIsHydrating(true);

    void loadAIChatMessages({ userId, role })
      .then((storedMessages) => {
        if (!active) {
          return;
        }

        setMessages(storedMessages);
        setIsHydrating(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setMessages([]);
        setIsHydrating(false);
      });

    return () => {
      active = false;
    };
  }, [role, userId, userRole]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session.user.role !== role) {
    return <Redirect href={roleHomePaths[session.user.role]} />;
  }

  const typingText = `CliniX AI is typing${'.'.repeat((typingTick % 3) + 1)}`;

  const quickPrompts = useMemo(() => {
    if (role === 'doctor') {
      return [
        'Draft a SOAP assessment from this encounter.',
        'Draft concise prescription instructions for discharge.',
      ];
    }

    return ['Explain my latest result in simple terms.', 'How should I take this medication safely?'];
  }, [role]);

  const canSend = promptValue.trim().length >= 4 && !chatMutation.isPending;

  const handleClearChat = () => {
    Alert.alert('Clear local chat?', 'This removes your saved CliniX AI conversation on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void clearAIChatMessages({ userId: session.user.id, role }).then(() => {
            setMessages([]);
          });
        },
      },
    ]);
  };

  const onSubmit = handleSubmit(async (values) => {
    const userMessage = createMessage('user', values.prompt.trim());
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    reset({
      prompt: '',
      patientContext: values.patientContext,
    });

    await saveAIChatMessages({ userId: session.user.id, role }, nextMessages);

    let assistantMessage = createMessage(
      'assistant',
      'I am temporarily unavailable. Please try again in a moment.',
    );

    try {
      const response = await chatMutation.mutateAsync({
        role,
        messages: nextMessages.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        patientContext:
          role === 'doctor' && usePatientContext && values.patientContext.trim()
            ? values.patientContext.trim()
            : undefined,
      });

      setLatestCaution(response.caution || defaultCautionByRole[role]);
      assistantMessage = createMessage('assistant', response.content);
    } catch {
      setLatestCaution(defaultCautionByRole[role]);
    }

    const updatedMessages = [...nextMessages, assistantMessage];

    setMessages(updatedMessages);
    await saveAIChatMessages({ userId: session.user.id, role }, updatedMessages);
  });

  if (isHydrating) {
    return (
      <Screen title={title} subtitle="Loading local AI chat..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen title={title} subtitle={subtitle}>
      <Card>
        <Text style={styles.disclaimerTitle}>Safety Notice</Text>
        <Text style={styles.disclaimerText}>
          {role === 'doctor'
            ? 'Use AI output as a drafting aid for notes and prescriptions, then verify clinically.'
            : 'Use AI explanations for education only, and confirm decisions with your doctor.'}
        </Text>
        <Text style={styles.cautionTag}>{latestCaution}</Text>
      </Card>

      {role === 'doctor' ? (
        <Card>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Use patient context</Text>
              <Text style={styles.toggleHint}>Include patient summary/context to improve draft relevance.</Text>
            </View>
            <Switch
              accessibilityLabel="Use patient context"
              value={usePatientContext}
              onValueChange={setUsePatientContext}
              thumbColor={usePatientContext ? colors.primary : '#B5C8E3'}
              trackColor={{ false: '#D9E5F6', true: '#C6D9FF' }}
            />
          </View>

          {usePatientContext ? (
            <Controller
              control={control}
              name="patientContext"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>Patient Context</Text>
                  <TextInput
                    accessibilityLabel="Patient context"
                    multiline
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="e.g. 68M, uncontrolled diabetes, CKD stage 3, penicillin allergy..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.textArea, styles.contextArea, error && styles.errorBorder]}
                    textAlignVertical="top"
                    value={value}
                  />
                  {error?.message ? <Text style={styles.errorText}>{error.message}</Text> : null}
                </View>
              )}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.chatTitle}>Conversation</Text>
          <Pressable accessibilityRole="button" onPress={handleClearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear local chat</Text>
          </Pressable>
        </View>

        <View style={styles.quickPromptRow}>
          {quickPrompts.map((prompt) => (
            <Pressable key={prompt} onPress={() => setValue('prompt', prompt, { shouldValidate: true })} style={styles.quickPrompt}>
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>

        {messages.length === 0 ? (
          <EmptyState title="No AI messages yet" subtitle="Ask CliniX AI a question to start this conversation." />
        ) : (
          <View style={styles.messagesList}>
            {messages.map((message) => (
              <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.bubbleAuthor}>{message.role === 'user' ? 'You' : 'CliniX AI'}</Text>
                <Text style={styles.bubbleText}>{message.content}</Text>
                <Text style={styles.bubbleTime}>{new Date(message.createdAt).toLocaleTimeString()}</Text>
              </View>
            ))}

            {chatMutation.isPending ? (
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.bubbleAuthor}>CliniX AI</Text>
                <Text style={styles.typingText}>{typingText}</Text>
              </View>
            ) : null}
          </View>
        )}
      </Card>

      <Card>
        <Controller
          control={control}
          name="prompt"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                {role === 'doctor' ? 'Ask for note/prescription drafting help' : 'Ask about results or medication use'}
              </Text>
              <TextInput
                accessibilityLabel="AI chat prompt"
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder={
                  role === 'doctor'
                    ? 'Example: Draft a concise plan for hypertension follow-up.'
                    : 'Example: Explain this result and what I should do next.'
                }
                placeholderTextColor={colors.textMuted}
                style={[styles.textArea, error && styles.errorBorder]}
                textAlignVertical="top"
                value={value}
              />
              {error?.message ? <Text style={styles.errorText}>{error.message}</Text> : null}
            </View>
          )}
        />

        <PrimaryButton
          label={chatMutation.isPending ? 'CliniX AI is typing...' : 'Send to CliniX AI'}
          loading={chatMutation.isPending}
          disabled={!canSend}
          onPress={onSubmit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  disclaimerTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  disclaimerText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  cautionTag: {
    backgroundColor: '#FFF5DD',
    borderRadius: radius.sm,
    color: '#8A6100',
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  toggleTextWrap: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  toggleTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  chatTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  clearButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickPrompt: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quickPromptText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  messagesList: {
    gap: spacing.sm,
  },
  bubble: {
    borderRadius: radius.md,
    maxWidth: '92%',
    padding: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8F0FF',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  bubbleAuthor: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  bubbleText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  bubbleTime: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontStyle: 'italic',
  },
  inputField: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 110,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  contextArea: {
    minHeight: 90,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
