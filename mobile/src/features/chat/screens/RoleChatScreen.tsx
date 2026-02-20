import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { UserRole } from '@/src/core/types/auth';
import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useChatMessagesQuery } from '@/src/features/chat/hooks/useChatMessagesQuery';
import { useSendChatMessageMutation } from '@/src/features/chat/hooks/useSendChatMessageMutation';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

type RoleChatScreenProps = {
  role: UserRole;
  senderName: string;
  title: string;
  subtitle: string;
};

export function RoleChatScreen({ role, senderName, title, subtitle }: RoleChatScreenProps): React.JSX.Element {
  const [messageInput, setMessageInput] = useState('');
  const messagesQuery = useChatMessagesQuery(role);
  const sendMutation = useSendChatMessageMutation(role);
  const handleRefresh = () => {
    void messagesQuery.refetch();
  };

  const canSend = useMemo(() => messageInput.trim().length > 0 && !sendMutation.isPending, [messageInput, sendMutation.isPending]);

  const handleSend = async () => {
    const body = messageInput.trim();

    if (!body) {
      return;
    }

    try {
      await sendMutation.mutateAsync({
        body,
        role,
        senderName,
      });
    } catch {
      return;
    }

    setMessageInput('');
  };

  if (messagesQuery.isLoading) {
    return (
      <Screen title={title} subtitle="Loading encrypted thread..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      refreshing={messagesQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <Card>
        <Text style={styles.secureLabel}>Secure chat: messages are token-authenticated and flagged as encrypted.</Text>
      </Card>

      {!messagesQuery.data || messagesQuery.data.length === 0 ? (
        <EmptyState title="No messages yet" subtitle="Start the conversation with your care team." />
      ) : (
        <View style={styles.list}>
          {messagesQuery.data.map((message) => {
            const mine = message.senderName === senderName;
            return (
              <View key={message.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={styles.bubbleSender}>{message.senderName}</Text>
                <Text style={styles.bubbleText}>{message.body}</Text>
                <Text style={styles.bubbleTime}>{new Date(message.sentAt).toLocaleTimeString()}</Text>
              </View>
            );
          })}
        </View>
      )}

      <Card>
        <TextInput
          accessibilityLabel="Message input"
          multiline
          onChangeText={setMessageInput}
          placeholder="Type a secure message"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={messageInput}
        />
        <PrimaryButton
          label={sendMutation.isPending ? 'Sending...' : 'Send Message'}
          loading={sendMutation.isPending}
          disabled={!canSend}
          onPress={handleSend}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  secureLabel: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.sm,
  },
  bubble: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bubbleMine: {
    backgroundColor: '#E8F0FF',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  bubbleSender: {
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
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.sm,
    minHeight: 96,
    padding: spacing.sm,
    textAlignVertical: 'top',
  },
});
