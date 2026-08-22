import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@theme';

export default function SplashScreen() {
  return (
    <View style={styles.container} testID="splash-screen">
      <Text style={styles.title}>AppManicure</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headingLarge,
    color: colors.primary,
  },
});
