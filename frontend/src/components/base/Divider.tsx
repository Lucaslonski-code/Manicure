import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@theme';

interface DividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
  gold?: boolean;
}

export default function Divider({
  color = colors.border,
  thickness = 1,
  marginVertical = spacing.md,
  gold = false,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: gold ? colors.gold : color,
          height: thickness,
          marginVertical,
          opacity: gold ? 0.3 : 1,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
