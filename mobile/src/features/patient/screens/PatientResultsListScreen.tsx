import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useLabResultsQuery } from '@/src/features/patient/hooks/useLabResultsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

export function PatientResultsListScreen(): React.JSX.Element {
  const router = useRouter();
  const resultsQuery = useLabResultsQuery();
  const handleRefresh = () => {
    void resultsQuery.refetch();
  };

  if (resultsQuery.isLoading) {
    return (
      <Screen title="Results" subtitle="Loading lab and imaging results..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  if (!resultsQuery.data || resultsQuery.data.length === 0) {
    return (
      <Screen
        title="Results"
        subtitle="No available results."
        refreshing={resultsQuery.isRefetching}
        onRefresh={handleRefresh}
      >
        <EmptyState title="No results" subtitle="Your lab and imaging results will appear here." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Results"
      subtitle="Open any result for detailed interpretation."
      refreshing={resultsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
      <PrimaryButton label="Open CliniX AI" onPress={() => router.push('/(app)/(patient)/clinix-ai')} />

      <View style={styles.list}>
        {resultsQuery.data.map((result) => (
          <Pressable
            key={result.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/(patient)/result/[resultId]',
                params: { resultId: result.id },
              })
            }
            style={styles.resultCard}
          >
            <Text style={styles.title}>{result.name}</Text>
            <Text style={styles.meta}>{result.kind.toUpperCase()} - {result.status.toUpperCase()}</Text>
            <Text style={styles.meta}>Ordered by {result.orderedBy}</Text>
            <Text style={styles.meta}>Collected {new Date(result.collectedAt).toDateString()}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
