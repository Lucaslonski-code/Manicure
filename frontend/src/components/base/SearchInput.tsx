import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text: string) => void;
  autoSearch?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function SearchInput({
  value,
  onChangeText,
  onSearch,
  autoSearch = false,
  placeholder = 'Buscar...',
  label,
  error,
  containerStyle,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoSearch && onSearch) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [value, autoSearch, onSearch]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.row, focused && styles.rowFocused]}>
        <View style={styles.iconContainer}>
        <AppIcon
          name="search"
          size={iconSizes.sm}
          color={focused ? 'gold' : 'secondary'}
        />
      </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label || 'Buscar'}
        />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    ...elevation.none,
  },
  rowFocused: {
    borderColor: colors.gold,
    borderWidth: 1.5,
    ...elevation.sm,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    ...typography.input,
    color: colors.textPrimary,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
