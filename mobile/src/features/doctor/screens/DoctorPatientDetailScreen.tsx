import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useDoctorPatientDetailQuery } from '@/src/features/doctor/hooks/useDoctorPatientDetailQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

type PatientDetailTab = 'History' | 'Notes' | 'Prescriptions' | 'Results' | 'Vitals';

const tabs: PatientDetailTab[] = ['History', 'Notes', 'Prescriptions', 'Results', 'Vitals'];

export function DoctorPatientDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string }>();
  const patientId = params.patientId ?? '';

  const detailQuery = useDoctorPatientDetailQuery(patientId);
  const [activeTab, setActiveTab] = useState<PatientDetailTab>('History');
  const handleRefresh = () => {
    void detailQuery.refetch();
  };

  if (!patientId) {
    return (
      <Screen title="Patient Details" subtitle="Missing patient id.">
        <EmptyState title="Invalid route" subtitle="Open this screen from patient list." />
      </Screen>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Screen title="Patient Details" subtitle="Loading patient details..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!detailQuery.data) {
    return (
      <Screen
        title="Patient Details"
        subtitle="Unable to load patient details."
        refreshing={detailQuery.isRefetching}
        onRefresh={handleRefresh}
      >
        <EmptyState title="No data" subtitle="Please try again." />
      </Screen>
    );
  }

  const detail = detailQuery.data;

  const tabContent = useMemo(() => {
    if (activeTab === 'History') {
      return (
        <View style={styles.itemsList}>
          {detail.history.length === 0 ? (
            <Text style={styles.emptyText}>No history entries.</Text>
          ) : (
            detail.history.map((entry) => (
              <View key={entry} style={styles.itemBlock}>
                <Text style={styles.line}>- {entry}</Text>
              </View>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'Notes') {
      return (
        <View style={styles.itemsList}>
          {detail.notes.length === 0 ? (
            <Text style={styles.emptyText}>No consultation notes.</Text>
          ) : (
            detail.notes.map((note) => (
              <View key={note.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>SOAP Note - {new Date(note.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.line}>S: {note.subjective}</Text>
                <Text style={styles.line}>O: {note.objective}</Text>
                <Text style={styles.line}>A: {note.assessment}</Text>
                <Text style={styles.line}>P: {note.plan}</Text>
              </View>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'Prescriptions') {
      return (
        <View style={styles.itemsList}>
          {detail.prescriptions.length === 0 ? (
            <Text style={styles.emptyText}>No prescriptions found.</Text>
          ) : (
            detail.prescriptions.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{item.medication}</Text>
                <Text style={styles.line}>{item.dosage} - {item.frequency} - {item.duration}</Text>
                <Text style={styles.meta}>Status: {item.status.toUpperCase()}</Text>
                <Text style={styles.meta}>Instructions: {item.instructions}</Text>
              </View>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'Results') {
      return (
        <View style={styles.itemsList}>
          {detail.results.length === 0 ? (
            <Text style={styles.emptyText}>No results found.</Text>
          ) : (
            detail.results.map((result) => (
              <View key={result.id} style={styles.itemBlock}>
                <Text style={styles.itemTitle}>{result.name}</Text>
                <Text style={styles.meta}>{result.kind.toUpperCase()} - {result.status.toUpperCase()}</Text>
                <Text style={styles.line}>{result.summary}</Text>
              </View>
            ))
          )}
        </View>
      );
    }

    return (
      <View style={styles.itemsList}>
        {detail.vitals.length === 0 ? (
          <Text style={styles.emptyText}>No vitals records.</Text>
        ) : (
          detail.vitals.map((vital) => (
            <View key={vital.id} style={styles.itemBlock}>
              <Text style={styles.itemTitle}>{vital.label}</Text>
              <Text style={styles.line}>{vital.value}</Text>
              <Text style={styles.meta}>{new Date(vital.recordedAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    );
  }, [activeTab, detail.history, detail.notes, detail.prescriptions, detail.results, detail.vitals]);

  return (
    <Screen
      title="Patient Details"
      subtitle="Summary header and clinical tabs."
      refreshing={detailQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <Card>
        <Text style={styles.summaryHeader}>Summary Header</Text>
        <Text style={styles.patientName}>{detail.profile.fullName}</Text>
        <Text style={styles.meta}>Patient ID: {detail.profile.patientId}</Text>
        <Text style={styles.meta}>Age: {detail.profile.age} | Gender: {detail.profile.gender}</Text>
        <Text style={styles.meta}>Phone: {detail.profile.phone}</Text>
        <Text style={styles.meta}>Email: {detail.profile.email}</Text>
      </Card>

      <Card>
        <Text style={styles.tabsTitle}>Record Tabs</Text>
        <View style={styles.tabsWrap}>
          {tabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setActiveTab(tab)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>{activeTab}</Text>
        {tabContent}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton
          label="Create Note (SOAP)"
          onPress={() =>
            router.push({
              pathname: '/(app)/(doctor)/patient/[patientId]/note',
              params: { patientId },
            })
          }
        />
        <PrimaryButton
          label="Create Prescription"
          onPress={() =>
            router.push({
              pathname: '/(app)/(doctor)/patient/[patientId]/prescription',
              params: { patientId },
            })
          }
        />
        <PrimaryButton
          label="Create Lab/Imaging Order"
          onPress={() =>
            router.push({
              pathname: '/(app)/(doctor)/patient/[patientId]/lab-request',
              params: { patientId },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryHeader: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  patientName: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tabsTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  tabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.surface,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemBlock: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  line: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  actions: {
    gap: spacing.sm,
  },
});
