import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}

export default function SectionHeader({ title, subtitle, action, style, accent }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <View style={[styles.titleRow, accent && styles.titleRowAccent]}>
          <Text style={[styles.title, accent && styles.titleAccent]}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    marginBottom: spacing.xs,
  },
  titleRowAccent: {
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.sm,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  titleAccent: {
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    paddingHorizontal: 0,
  },
  action: {
    justifyContent: 'center',
  },
});
