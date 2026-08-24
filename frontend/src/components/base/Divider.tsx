import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@theme';

interface DividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

export default function Divider({
  color = colors.border,
  thickness = 1,
  marginVertical = spacing.md,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical,
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
