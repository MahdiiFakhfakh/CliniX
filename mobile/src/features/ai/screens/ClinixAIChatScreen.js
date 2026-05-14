import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, fonts, radius, shadows, spacing, typography } from '@/src/core/theme/tokens';
import { useClinixAIChatMutation } from '@/src/features/ai/hooks/useClinixAIChatMutation';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';
import { useAuthStore } from '@/src/store/authStore';
import { clearAIChatMessages, loadAIChatMessages, saveAIChatMessages } from '@/src/services/storage/aiChatStorage';

const defaultCautionByRole = {
    patient: 'Education only. Confirm care decisions with your doctor.',
    doctor: 'Draft support only. Verify clinically before use.',
};

const patientPromptCards = [
    {
        id: 'symptoms',
        icon: 'help-circle',
        label: 'Symptom guidance',
        prompt: 'Help me understand these symptoms and what questions I should ask my doctor.',
    },
    {
        id: 'medication',
        icon: 'medication',
        label: 'Medication help',
        prompt: 'How should I take this medication safely, and what side effects should I watch for?',
    },
    {
        id: 'visit',
        icon: 'event-note',
        label: 'Prepare visit',
        prompt: 'Help me prepare a short list of questions for my next appointment.',
    },
];

const doctorPromptCards = [
    {
        id: 'soap',
        icon: 'assignment',
        label: 'SOAP note',
        prompt: 'Draft a concise SOAP assessment from this encounter.',
    },
    {
        id: 'instructions',
        icon: 'medical-services',
        label: 'Discharge plan',
        prompt: 'Draft concise prescription instructions for discharge.',
    },
];

function createMessage(role, content) {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        createdAt: new Date().toISOString(),
    };
}

function formatMessageTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
            {!isUser ? (
                <View style={styles.aiAvatar}>
                    <AppIcon color="#FFFFFF" name="auto-awesome" size={16} />
                </View>
            ) : null}
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleAuthor, isUser && styles.userBubbleAuthor]}>
                    {isUser ? 'You' : 'CliniX AI'}
                </Text>
                <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{message.content}</Text>
                <Text style={[styles.bubbleTime, isUser && styles.userBubbleTime]}>
                    {formatMessageTime(message.createdAt)}
                </Text>
            </View>
        </View>
    );
}

export function ClinixAIChatScreen({ role, title, subtitle }) {
    const session = useAuthStore((state) => state.session);
    const userId = session?.user.id;
    const userRole = session?.user.role;
    const insets = useSafeAreaInsets();
    const scrollRef = useRef(null);
    const chatMutation = useClinixAIChatMutation();

    const [messages, setMessages] = useState([]);
    const [isHydrating, setIsHydrating] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [promptError, setPromptError] = useState('');
    const [patientContext, setPatientContext] = useState('');
    const [contextError, setContextError] = useState('');
    const [usePatientContext, setUsePatientContext] = useState(true);
    const [typingTick, setTypingTick] = useState(0);
    const [latestCaution, setLatestCaution] = useState(defaultCautionByRole[role]);

    const promptCards = useMemo(
        () => (role === 'doctor' ? doctorPromptCards : patientPromptCards),
        [role],
    );

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
                if (!active) return;
                setMessages(storedMessages);
                setIsHydrating(false);
            })
            .catch(() => {
                if (!active) return;
                setMessages([]);
                setIsHydrating(false);
            });

        return () => {
            active = false;
        };
    }, [role, userId, userRole]);

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 80);
        return () => clearTimeout(timer);
    }, [messages, chatMutation.isPending]);

    if (!session) {
        return <Redirect href="/(auth)/login" />;
    }

    if (session.user.role !== role) {
        return <Redirect href={roleHomePaths[session.user.role]} />;
    }

    const typingText = `Thinking${'.'.repeat((typingTick % 3) + 1)}`;
    const trimmedPrompt = prompt.trim();
    const canSend = trimmedPrompt.length >= 4 && !chatMutation.isPending;

    const selectPrompt = (value) => {
        setPrompt(value);
        setPromptError('');
    };

    const handleClearChat = () => {
        Alert.alert('Clear chat?', 'This removes your saved CliniX AI conversation on this device.', [
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

    const handleSend = async () => {
        if (trimmedPrompt.length < 4) {
            setPromptError('Enter at least 4 characters.');
            return;
        }
        if (patientContext.trim().length > 500) {
            setContextError('Keep context within 500 characters.');
            return;
        }

        const userMessage = createMessage('user', trimmedPrompt);
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setPrompt('');
        setPromptError('');
        await saveAIChatMessages({ userId: session.user.id, role }, nextMessages);

        let assistantMessage = createMessage('assistant', 'I am temporarily unavailable. Please try again in a moment.');
        try {
            const response = await chatMutation.mutateAsync({
                role,
                messages: nextMessages.map((item) => ({
                    role: item.role,
                    content: item.content,
                })),
                patientContext:
                    role === 'doctor' && usePatientContext && patientContext.trim()
                        ? patientContext.trim()
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
    };

    if (isHydrating) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
                <LoadingView label="Loading CliniX AI..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.flex}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 116 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroIcon}>
                                <AppIcon color="#FFFFFF" name="auto-awesome" size={26} />
                            </View>
                            <View style={styles.heroStatus}>
                                <View style={styles.statusDot} />
                                <Text style={styles.heroStatusText}>Available</Text>
                            </View>
                        </View>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={styles.heroSubtitle}>{subtitle}</Text>
                        <View style={styles.safetyRow}>
                            <AppIcon color={colors.warningText} name="verified-user" size={18} />
                            <Text style={styles.safetyText}>{latestCaution}</Text>
                        </View>
                    </View>

                    {role === 'doctor' ? (
                        <View style={styles.contextCard}>
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleTextWrap}>
                                    <Text style={styles.sectionTitle}>Patient context</Text>
                                    <Text style={styles.contextHint}>Optional summary for better clinical drafts.</Text>
                                </View>
                                <Switch
                                    accessibilityLabel="Use patient context"
                                    onValueChange={setUsePatientContext}
                                    thumbColor={usePatientContext ? colors.primary : colors.disabled}
                                    trackColor={{ false: colors.border, true: colors.primarySoft }}
                                    value={usePatientContext}
                                />
                            </View>
                            {usePatientContext ? (
                                <>
                                    <TextInput
                                        accessibilityLabel="Patient context"
                                        multiline
                                        onChangeText={(value) => {
                                            setPatientContext(value);
                                            setContextError('');
                                        }}
                                        placeholder="e.g. 68M, diabetes, CKD stage 3, penicillin allergy..."
                                        placeholderTextColor={colors.textMuted}
                                        style={[styles.contextInput, contextError && styles.errorBorder]}
                                        textAlignVertical="top"
                                        value={patientContext}
                                    />
                                    {contextError ? <Text style={styles.errorText}>{contextError}</Text> : null}
                                </>
                            ) : null}
                        </View>
                    ) : null}

                    <View style={styles.promptSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Start with</Text>
                            {messages.length > 0 ? (
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={handleClearChat}
                                    style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.65 }]}
                                >
                                    <AppIcon color={colors.primary} name="delete-outline" size={16} />
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </Pressable>
                            ) : null}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptCardsRow}>
                            {promptCards.map((item) => (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                    key={item.id}
                                    onPress={() => selectPrompt(item.prompt)}
                                    style={({ pressed }) => [styles.promptCard, pressed && styles.promptCardPressed]}
                                >
                                    <View style={styles.promptIcon}>
                                        <AppIcon color={colors.primary} name={item.icon} size={20} />
                                    </View>
                                    <Text style={styles.promptCardText}>{item.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.chatPanel}>
                        {messages.length === 0 ? (
                            <View style={styles.emptyChat}>
                                <View style={styles.emptyIcon}>
                                    <AppIcon color={colors.primary} name="lightbulb-outline" size={26} />
                                </View>
                                <Text style={styles.emptyTitle}>Ask in plain language</Text>
                                <Text style={styles.emptyText}>
                                    CliniX AI can explain medical terms, help prepare questions, and make instructions easier to understand.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.messagesList}>
                                {messages.map((message) => (
                                    <MessageBubble key={message.id} message={message} />
                                ))}
                            </View>
                        )}

                        {chatMutation.isPending ? (
                            <View style={styles.typingBubble}>
                                <View style={styles.aiAvatar}>
                                    <AppIcon color="#FFFFFF" name="auto-awesome" size={16} />
                                </View>
                                <View style={styles.typingContent}>
                                    <Text style={styles.bubbleAuthor}>CliniX AI</Text>
                                    <Text style={styles.typingText}>{typingText}</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>

                <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}>
                    <View style={styles.composer}>
                        <TextInput
                            accessibilityLabel="AI chat prompt"
                            multiline
                            onChangeText={(value) => {
                                setPrompt(value);
                                setPromptError('');
                            }}
                            placeholder={
                                role === 'doctor'
                                    ? 'Ask for note or prescription help...'
                                    : 'Ask about symptoms, medicine, or your next visit...'
                            }
                            placeholderTextColor={colors.textMuted}
                            style={[styles.composerInput, promptError && styles.errorBorder]}
                            textAlignVertical="top"
                            value={prompt}
                        />
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Send to CliniX AI"
                            disabled={!canSend}
                            onPress={handleSend}
                            style={({ pressed }) => [
                                styles.sendButton,
                                !canSend && styles.sendButtonDisabled,
                                pressed && canSend && styles.sendButtonPressed,
                            ]}
                        >
                            <AppIcon color="#FFFFFF" name="send" size={20} />
                        </Pressable>
                    </View>
                    {promptError ? <Text style={styles.composerError}>{promptError}</Text> : null}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    heroCard: {
        overflow: 'hidden',
        borderRadius: radius.lg,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
    heroStatus: {
        minHeight: 34,
        borderRadius: radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.successSoft,
        borderWidth: 1,
        borderColor: colors.successBorder,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    heroStatusText: {
        color: colors.text,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroTitle: {
        color: colors.text,
        fontSize: 28,
        lineHeight: 34,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    heroSubtitle: {
        marginTop: spacing.xs,
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    safetyRow: {
        marginTop: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: colors.warningSoft,
        borderWidth: 1,
        borderColor: '#FDE68A',
        padding: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
    },
    safetyText: {
        flex: 1,
        color: colors.warningText,
        fontSize: typography.bodySmall,
        lineHeight: 19,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    contextCard: {
        borderRadius: radius.md,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    toggleTextWrap: {
        flex: 1,
    },
    contextHint: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: typography.caption,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    contextInput: {
        minHeight: 96,
        marginTop: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        color: colors.text,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
    promptSection: {
        gap: spacing.xs,
    },
    sectionHeader: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    clearButton: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.xs,
    },
    clearButtonText: {
        color: colors.primary,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    promptCardsRow: {
        paddingVertical: spacing.xs,
        gap: spacing.sm,
    },
    promptCard: {
        width: 136,
        minHeight: 104,
        borderRadius: radius.md,
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'space-between',
    },
    promptCardPressed: {
        backgroundColor: colors.surfaceTint,
    },
    promptIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptCardText: {
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 19,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    chatPanel: {
        minHeight: 260,
        borderRadius: radius.lg,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    emptyChat: {
        minHeight: 228,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    emptyTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
        textAlign: 'center',
    },
    messagesList: {
        gap: spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.xs,
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    aiAvatar: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        maxWidth: '84%',
        borderRadius: 18,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    aiBubble: {
        borderBottomLeftRadius: 6,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    userBubble: {
        borderBottomRightRadius: 6,
        backgroundColor: colors.primary,
    },
    bubbleAuthor: {
        color: colors.primary,
        fontSize: typography.caption,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
        marginBottom: 4,
    },
    userBubbleAuthor: {
        color: '#CCFBF1',
    },
    bubbleText: {
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 22,
        fontFamily: fonts.bodyRegular,
    },
    userBubbleText: {
        color: '#FFFFFF',
    },
    bubbleTime: {
        marginTop: 5,
        color: colors.textMuted,
        fontSize: 11,
        fontFamily: fonts.bodyMedium,
        alignSelf: 'flex-end',
    },
    userBubbleTime: {
        color: '#CCFBF1',
    },
    typingBubble: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.xs,
    },
    typingContent: {
        borderRadius: 18,
        borderBottomLeftRadius: 6,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    typingText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyMedium,
        fontStyle: 'italic',
    },
    composerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: spacing.xs,
        paddingHorizontal: spacing.md,
        backgroundColor: 'rgba(248,250,252,0.96)',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    composer: {
        minHeight: 58,
        borderRadius: 22,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 6,
        gap: spacing.xs,
        ...shadows.card,
    },
    composerInput: {
        flex: 1,
        maxHeight: 118,
        minHeight: 44,
        paddingHorizontal: spacing.sm,
        paddingTop: 11,
        paddingBottom: 9,
        color: colors.text,
        fontSize: typography.body,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonPressed: {
        backgroundColor: colors.primaryMid,
    },
    sendButtonDisabled: {
        backgroundColor: colors.disabled,
    },
    errorBorder: {
        borderColor: colors.danger,
    },
    errorText: {
        marginTop: spacing.xs,
        color: colors.danger,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    composerError: {
        marginTop: 4,
        marginLeft: spacing.sm,
        color: colors.danger,
        fontSize: typography.caption,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
});
