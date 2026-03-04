import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';
import { usePreferencesStore } from '@/src/store/preferencesStore';
import AppIcon from '@/src/shared/components/AppIcon';

const palette = {
    screen: '#EEF1F4',
    surface: '#FFFFFF',
    section: '#DCE2E7',
    text: '#111827',
    muted: '#5B6775',
    border: '#DEE4EA',
    blue: '#1D9BF0',
};

function SectionHeader({ title }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );
}

function SimpleRow({ title, subtitle }) {
    return (
        <View style={styles.row}>
            <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
            </View>
            <AppIcon color="#A3AAB3" name="chevron-forward" size={18} />
        </View>
    );
}

export function PrivacySafetyScreen() {
    const router = useRouter();
    const session = useAuthStore((state) => state.session);
    const handleText = session?.user.email ? `@${session.user.email.split('@')[0]}` : '@clinix_user';

    const protectAccount = usePreferencesStore((state) => state.protectAccount);
    const setProtectAccount = usePreferencesStore((state) => state.setProtectAccount);
    const photoTaggingEnabled = usePreferencesStore((state) => state.photoTaggingEnabled);
    const setPhotoTaggingEnabled = usePreferencesStore((state) => state.setPhotoTaggingEnabled);
    const directMessagesEnabled = usePreferencesStore((state) => state.directMessagesEnabled);
    const setDirectMessagesEnabled = usePreferencesStore((state) => state.setDirectMessagesEnabled);
    const discoverabilityEnabled = usePreferencesStore((state) => state.discoverabilityEnabled);
    const setDiscoverabilityEnabled = usePreferencesStore((state) => state.setDiscoverabilityEnabled);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <AppIcon color={palette.blue} name="arrow-back" size={24} />
                    </Pressable>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>Privacy and safety</Text>
                        <Text style={styles.handleText}>{handleText}</Text>
                    </View>
                </View>

                <SectionHeader title="Account" />
                <View style={styles.listBlock}>
                    <View style={styles.protectRow}>
                        <View style={styles.protectTextWrap}>
                            <Text style={styles.protectTitle}>Protect your account</Text>
                            <Text style={styles.protectDescription}>
                                Only approved followers will be able to view your profile activity.{' '}
                                <Text style={styles.learnMore}>Learn more</Text>
                            </Text>
                        </View>
                        <Switch
                            accessibilityLabel="Protect your account"
                            onValueChange={setProtectAccount}
                            trackColor={{ false: '#C7D1DB', true: '#9FD1F8' }}
                            thumbColor={protectAccount ? palette.blue : '#FFFFFF'}
                            value={protectAccount}
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.rowTextWrap}>
                            <Text style={styles.rowTitle}>Photo tagging</Text>
                            <Text style={styles.rowSubtitle}>{photoTaggingEnabled ? 'On' : 'Off'}</Text>
                        </View>
                        <Switch
                            accessibilityLabel="Photo tagging"
                            onValueChange={setPhotoTaggingEnabled}
                            trackColor={{ false: '#C7D1DB', true: '#9FD1F8' }}
                            thumbColor={photoTaggingEnabled ? palette.blue : '#FFFFFF'}
                            value={photoTaggingEnabled}
                        />
                    </View>
                </View>

                <SectionHeader title="Direct messages" />
                <View style={styles.listBlock}>
                    <View style={styles.toggleRow}>
                        <View style={styles.rowTextWrap}>
                            <Text style={styles.rowTitle}>Direct Messages</Text>
                            <Text style={styles.rowSubtitle}>
                                {directMessagesEnabled ? 'Allow messages' : 'Blocked'}
                            </Text>
                        </View>
                        <Switch
                            accessibilityLabel="Direct messages"
                            onValueChange={setDirectMessagesEnabled}
                            trackColor={{ false: '#C7D1DB', true: '#9FD1F8' }}
                            thumbColor={directMessagesEnabled ? palette.blue : '#FFFFFF'}
                            value={directMessagesEnabled}
                        />
                    </View>
                </View>

                <SectionHeader title="Discoverability and contacts" />
                <View style={styles.listBlock}>
                    <View style={styles.toggleRow}>
                        <View style={styles.rowTextWrap}>
                            <Text style={styles.rowTitle}>Discoverability and contacts</Text>
                            <Text style={styles.rowSubtitle}>
                                Control how your data is used to connect you with people.
                            </Text>
                        </View>
                        <Switch
                            accessibilityLabel="Discoverability and contacts"
                            onValueChange={setDiscoverabilityEnabled}
                            trackColor={{ false: '#C7D1DB', true: '#9FD1F8' }}
                            thumbColor={discoverabilityEnabled ? palette.blue : '#FFFFFF'}
                            value={discoverabilityEnabled}
                        />
                    </View>

                    <View style={styles.learnRow}>
                        <Text style={styles.learnMore}>Learn more</Text>
                        <Text style={styles.learnText}> about how this data is used to connect you with people.</Text>
                    </View>
                </View>

                <SectionHeader title="Safety" />
                <View style={styles.listBlock}>
                    <SimpleRow title="Muted keywords" subtitle="Manage hidden words and phrases" />
                    <SimpleRow title="Blocked accounts" subtitle="Review blocked profiles" />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: palette.screen,
    },
    container: {
        flex: 1,
        backgroundColor: palette.screen,
    },
    headerRow: {
        minHeight: 64,
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        color: palette.text,
        fontSize: 22,
        lineHeight: 28,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    handleText: {
        color: palette.muted,
        fontSize: 15,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    sectionHeader: {
        marginTop: 12,
        backgroundColor: palette.section,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: palette.border,
    },
    sectionHeaderText: {
        color: '#617283',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: fonts.bodyBold,
        fontWeight: '700',
    },
    listBlock: {
        backgroundColor: palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    row: {
        minHeight: 56,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    protectRow: {
        minHeight: 96,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    protectTextWrap: {
        flex: 1,
        marginRight: 12,
    },
    protectTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
        marginBottom: 2,
    },
    protectDescription: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodyRegular,
    },
    rowTextWrap: {
        flex: 1,
        marginRight: 10,
    },
    rowTitle: {
        color: palette.text,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
    },
    rowSubtitle: {
        marginTop: 2,
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
    toggleRow: {
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    learnRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    learnMore: {
        color: palette.blue,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyMedium,
        fontWeight: '500',
    },
    learnText: {
        color: palette.muted,
        fontSize: 14,
        lineHeight: 19,
        fontFamily: fonts.bodyRegular,
    },
});
