import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@theme';

export default function BookingConfirmationScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendamento confirmado!</Text>
      <Text style={styles.text}>Seu agendamento foi realizado com sucesso.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('MyAppointments')}
      >
        <Text style={styles.buttonText}>Ver meus agendamentos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={styles.secondaryButtonText}>Voltar para início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  buttonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
