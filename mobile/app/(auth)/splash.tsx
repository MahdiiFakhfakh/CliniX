import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { roleHomePaths } from '@/src/core/navigation/paths';
import { colors, spacing, typography } from '@/src/core/theme/tokens';
import { useAuthStore } from '@/src/store/authStore';

export default function SplashRoute(): React.JSX.Element {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      router.replace(roleHomePaths[session.user.role]);
    }, 700);

    return () => clearTimeout(timeout);
  }, [router, session]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>C</Text>
      </View>
      <Text style={styles.title}>CliniX Mobile</Text>
      <Text style={styles.subtitle}>Secure hospital workflows for patient and doctor care.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 96,
  },
  logoText: {
    color: colors.surface,
    fontSize: 44,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
