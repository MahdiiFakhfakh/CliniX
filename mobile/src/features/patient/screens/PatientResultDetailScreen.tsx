import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/src/core/theme/tokens';
import { useLabResultsQuery } from '@/src/features/patient/hooks/useLabResultsQuery';
import { Card } from '@/src/shared/components/Card';
import { EmptyState } from '@/src/shared/components/EmptyState';
import { LoadingView } from '@/src/shared/components/LoadingView';
import { PrimaryButton } from '@/src/shared/components/PrimaryButton';
import { Screen } from '@/src/shared/components/Screen';

export function PatientResultDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultId: string }>();
  const resultId = params.resultId ?? '';

  const resultsQuery = useLabResultsQuery();

  if (resultsQuery.isLoading) {
    return (
      <Screen title="Result Details" subtitle="Loading result..." scroll={false}>
        <LoadingView />
      </Screen>
    );
  }

  const result = resultsQuery.data?.find((item) => item.id === resultId);

  if (!result) {
    return (
      <Screen title="Result Details" subtitle="Result not found.">
        <EmptyState title="Not found" subtitle="This result is unavailable." />
      </Screen>
    );
  }

  return (
    <Screen title="Result Details" subtitle="Clinical summary and next actions.">
      <Card>
        <Text style={styles.title}>{result.name}</Text>
        <Text style={styles.line}>Type: {result.kind.toUpperCase()}</Text>
        <Text style={styles.line}>Status: {result.status.toUpperCase()}</Text>
        <Text style={styles.line}>Ordered by: {result.orderedBy}</Text>
        <Text style={styles.line}>Collected: {new Date(result.collectedAt).toLocaleString()}</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Summary</Text>
          <Text style={styles.summaryText}>{result.summary}</Text>
        </View>
      </Card>

      <PrimaryButton
        label="Explain with CliniX AI"
        onPress={() =>
          router.push({
            pathname: '/(app)/(patient)/clinix-ai',
            params: { resultId: result.id },
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  line: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  summaryBox: {
    backgroundColor: '#F8FBFF',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
});
