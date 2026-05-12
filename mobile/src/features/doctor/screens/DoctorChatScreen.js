import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useChatMessagesQuery } from '@/src/features/chat/hooks/useChatMessagesQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const AVATAR_TONES = ['#BFDBFE', '#CFE3FF', '#DDD6FE', '#BBF7D0', '#FBCFE8', '#FDE68A', '#A7F3D0'];

const FALLBACK_THREADS = [
    { id: 'fb-1', name: 'Mariam Hassan', preview: 'Missed your audio call.', sentAt: '2026-03-03T00:39:00.000Z', unread: 1 },
    { id: 'fb-2', name: 'Youssef Fathi', preview: 'Could we review today\'s blood pressure trend?', sentAt: '2026-03-02T23:55:00.000Z', unread: 0 },
    { id: 'fb-3', name: 'Salma Nader', preview: 'The audio call ended.', sentAt: '2026-03-02T23:47:00.000Z', unread: 2 },
    { id: 'fb-4', name: 'Cardio Follow-up Group', preview: 'Latest ECG report uploaded.', sentAt: '2026-03-02T23:36:00.000Z', unread: 0 },
    { id: 'fb-5', name: 'ICU Shift Team', preview: 'Reacted to your last update.', sentAt: '2026-03-02T22:58:00.000Z', unread: 0 },
];

const formatTime = (dateInput) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            .format(date).toLowerCase();
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const toInitials = (name) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

const toneForName = (name) =>
    AVATAR_TONES[name.charCodeAt(0) % AVATAR_TONES.length];

export function DoctorChatScreen() {
    const insets = useSafeAreaInsets();
    const messagesQuery = useChatMessagesQuery('doctor');
    const [search, setSearch] = useState('');

    const threadItems = useMemo(() => {
        const latestBySender = new Map();
        (messagesQuery.data ?? []).forEach((message) => {
            const key = message.senderName ?? 'Patient';
            const existing = latestBySender.get(key);
            if (!existing || new Date(message.sentAt).getTime() > new Date(existing.sentAt).getTime()) {
                latestBySender.set(key, {
                    id: message.id,
                    name: key,
                    preview: message.body,
                    sentAt: message.sentAt,
                    unread: 0,
                });
            }
        });

        const dynamicItems = [...latestBySender.values()].sort(
            (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
        );
        const dynamicNames = new Set(dynamicItems.map((item) => item.name.toLowerCase()));
        const merged = [
            ...dynamicItems,
            ...FALLBACK_THREADS.filter((item) => !dynamicNames.has(item.name.toLowerCase())),
        ];

        const keyword = search.trim().toLowerCase();
        if (!keyword) return merged;
        return merged.filter(
            (item) =>
                item.name.toLowerCase().includes(keyword) ||
                item.preview.toLowerCase().includes(keyword),
        );
    }, [messagesQuery.data, search]);

    if (messagesQuery.isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
                <LoadingView label="Loading messages..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={messagesQuery.isRefetching}
                        onRefresh={() => void messagesQuery.refetch()}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Search */}
                <View style={styles.searchBar}>
                    <AppIcon color={colors.textMuted} name="search-outline" size={20} />
                    <TextInput
                        accessibilityLabel="Search messages"
                        onChangeText={setSearch}
                        placeholder="Search messages"
                        placeholderTextColor={colors.textMuted}
                        style={styles.searchInput}
                        value={search}
                    />
                    {search.length > 0 ? (
                        <Pressable onPress={() => setSearch('')} hitSlop={8}>
                            <AppIcon color={colors.textMuted} name="close-circle" size={18} />
                        </Pressable>
                    ) : null}
                </View>

                {/* Thread list */}
                <View style={styles.listCard}>
                    {threadItems.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No conversations found.</Text>
                        </View>
                    ) : (
                        threadItems.map((thread, index) => {
                            const tone = toneForName(thread.name);
                            const isLast = index === threadItems.length - 1;
                            return (
                                <Pressable
                                    accessibilityLabel={`Open chat with ${thread.name}`}
                                    accessibilityRole="button"
                                    key={thread.id}
                                    style={({ pressed }) => [
                                        styles.threadRow,
                                        !isLast && styles.threadRowDivider,
                                        pressed && styles.threadRowPressed,
                                    ]}
                                >
                                    <View style={[styles.avatar, { backgroundColor: tone }]}>
                                        <Text style={styles.avatarText}>{toInitials(thread.name)}</Text>
                                    </View>

                                    <View style={styles.threadBody}>
                                        <View style={styles.threadTopRow}>
                                            <Text numberOfLines={1} style={[styles.threadName, thread.unread > 0 && styles.threadNameUnread]}>
                                                {thread.name}
                                            </Text>
                                            <Text style={styles.threadTime}>{formatTime(thread.sentAt)}</Text>
                                        </View>
                                        <View style={styles.threadBottomRow}>
                                            <Text numberOfLines={1} style={styles.threadPreview}>
                                                {thread.preview}
                                            </Text>
                                            {thread.unread > 0 ? (
                                                <View style={styles.unreadBadge}>
                                                    <Text style={styles.unreadText}>{thread.unread}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    searchBar: {
        height: 48,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceTint,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontFamily: fonts.bodyMedium,
        fontSize: typography.body,
        lineHeight: 20,
    },
    listCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    threadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    threadRowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    threadRowPressed: {
        backgroundColor: colors.surfaceTint,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        flexShrink: 0,
    },
    avatarText: {
        color: '#1F2937',
        fontSize: 15,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    threadBody: {
        flex: 1,
        minWidth: 0,
    },
    threadTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 3,
    },
    threadName: {
        flex: 1,
        color: colors.text,
        fontSize: typography.bodyLarge,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
        marginRight: spacing.xs,
    },
    threadNameUnread: {
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    threadTime: {
        color: colors.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.bodyRegular,
        flexShrink: 0,
    },
    threadBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    threadPreview: {
        flex: 1,
        color: colors.textMuted,
        fontSize: typography.bodySmall,
        fontFamily: fonts.bodyRegular,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        flexShrink: 0,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    emptyWrap: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: typography.body,
        fontFamily: fonts.bodyRegular,
    },
});
