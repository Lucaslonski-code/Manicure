import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@theme';

interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width = 100,
  height = 16,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: 0.6 },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.beige,
    overflow: 'hidden',
  },
});
