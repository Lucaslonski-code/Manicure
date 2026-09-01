import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '@theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  accent?: boolean;
  onBack?: () => void;
}

export default function ScreenHeader({ title, subtitle, style, accent, onBack }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
      )}
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxxxxxl,
    paddingBottom: spacing.xxxxxxl,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: -spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textPrimary,
    lineHeight: 28,
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
    ...typography.section,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  titleAccent: {
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
