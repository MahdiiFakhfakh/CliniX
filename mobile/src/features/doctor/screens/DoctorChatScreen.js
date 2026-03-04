import { usePathname, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts } from '@/src/core/theme/tokens';
import { useChatMessagesQuery } from '@/src/features/chat/hooks/useChatMessagesQuery';
import { LoadingView } from '@/src/shared/components/LoadingView';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    background: '#F3F4F8',
    searchBg: '#E7E9EF',
    text: '#111827',
    muted: '#6B7280',
    subtle: '#9CA3AF',
    border: '#E5E7EB',
};

const FALLBACK_THREADS = [
    { id: 'fb-1', name: 'Mariam Hassan', preview: 'Missed your audio call.', sentAt: '2026-03-03T00:39:00.000Z', muted: false, tone: '#BFDBFE' },
    { id: 'fb-2', name: 'Youssef Fathi', preview: 'Could we review today\'s blood pressure trend?', sentAt: '2026-03-02T23:55:00.000Z', muted: true, tone: '#CFE3FF' },
    { id: 'fb-3', name: 'Salma Nader', preview: 'The audio call ended.', sentAt: '2026-03-02T23:47:00.000Z', muted: false, tone: '#DDD6FE' },
    { id: 'fb-4', name: 'Cardio Follow-up Group', preview: 'Latest ECG report uploaded.', sentAt: '2026-03-02T23:36:00.000Z', muted: true, tone: '#BBF7D0' },
    { id: 'fb-5', name: 'ICU Shift Team', preview: 'Reacted to your last update.', sentAt: '2026-03-02T22:58:00.000Z', muted: false, tone: '#FBCFE8' },
];

const formatTime = (dateInput) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return 'now';
    }
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
        .format(date)
        .toLowerCase();
};

const toInitials = (name) => {
    const parts = name
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2);
    if (parts.length === 0) {
        return 'PT';
    }
    return parts.map((part) => part[0].toUpperCase()).join('');
};

export function DoctorChatScreen() {
    const router = useRouter();
    const pathname = usePathname();
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
                    muted: false,
                    tone: '#BFDBFE',
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
        if (!keyword) {
            return merged;
        }
        return merged.filter(
            (item) =>
                item.name.toLowerCase().includes(keyword) ||
                item.preview.toLowerCase().includes(keyword),
        );
    }, [messagesQuery.data, search]);

    if (messagesQuery.isLoading) {
        return (
            <View style={styles.loadingWrap}>
                <LoadingView label="Loading messages..." />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBar}>
                    <AppIcon color={palette.subtle} name="search" size={24} />
                    <TextInput
                        accessibilityLabel="Search messages"
                        onChangeText={setSearch}
                        placeholder="Search"
                        placeholderTextColor={palette.muted}
                        style={styles.searchInput}
                        value={search}
                    />
                </View>

                <View style={styles.list}>
                    {threadItems.map((thread) => (
                        <Pressable
                            accessibilityLabel={`Open chat with ${thread.name}`}
                            accessibilityRole="button"
                            key={thread.id}
                            onPress={() => {
                                if (pathname !== '/chat') {
                                    router.push('/(app)/(doctor)/chat');
                                }
                            }}
                            style={styles.threadRow}
                        >
                            <View style={[styles.threadAvatar, { backgroundColor: thread.tone }]}> 
                                <Text style={styles.threadInitials}>{toInitials(thread.name)}</Text>
                            </View>

                            <View style={styles.threadContent}>
                                <Text numberOfLines={1} style={styles.threadName}>
                                    {thread.name}
                                </Text>
                                <Text numberOfLines={1} style={styles.threadPreview}>
                                    {thread.preview}
                                </Text>
                            </View>

                            <View style={styles.trailingWrap}>
                                <Text style={styles.threadTime}>{formatTime(thread.sentAt)}</Text>
                                {thread.muted ? <Text style={styles.mutedMark}>Muted</Text> : null}
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    loadingWrap: {
        flex: 1,
        backgroundColor: palette.background,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
    },
    searchBar: {
        height: 56,
        borderRadius: 16,
        backgroundColor: palette.searchBg,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: palette.text,
        fontFamily: fonts.bodyMedium,
        fontSize: 18,
        lineHeight: 22,
    },
    list: {
        marginTop: 14,
    },
    threadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEFF3',
    },
    threadAvatar: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    threadInitials: {
        color: '#1F2937',
        fontSize: 18,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    threadContent: {
        flex: 1,
        marginLeft: 12,
    },
    threadName: {
        color: '#030712',
        fontSize: 24,
        lineHeight: 29,
        fontFamily: fonts.bodySemiBold,
        fontWeight: '600',
    },
    threadPreview: {
        marginTop: 2,
        color: '#6B7280',
        fontSize: 18,
        lineHeight: 23,
        fontFamily: fonts.bodyRegular,
    },
    trailingWrap: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    threadTime: {
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 18,
        fontFamily: fonts.bodyRegular,
    },
    mutedMark: {
        marginTop: 4,
        color: palette.subtle,
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyMedium,
    },
});
