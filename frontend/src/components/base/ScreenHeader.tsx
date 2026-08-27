import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, radius } from '@theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  accent?: boolean;
}

export default function ScreenHeader({ title, subtitle, style, accent }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <View style={[styles.titleRow, accent && styles.titleRowAccent]}>
          {accent && (
            <View style={styles.accentLine} />
          )}
          <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    marginBottom: spacing.xs,
  },
  titleRowAccent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentLine: {
    width: 3,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  titleAccent: {
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
