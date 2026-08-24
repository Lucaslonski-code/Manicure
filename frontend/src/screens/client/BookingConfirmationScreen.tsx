import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';

export default function BookingConfirmationScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.title}>Agendamento confirmado!</Text>
      <Text style={styles.text}>
        Seu agendamento foi realizado com sucesso. Você receberá uma notificação antes do horário.
      </Text>
      <View style={styles.actions}>
        <Button
          title="Ver meus agendamentos"
          onPress={() => navigation.replace('MyAppointments')}
        />
        <SecondaryButton
          title="Voltar para início"
          onPress={() => navigation.replace('Home')}
        />
      </View>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 124, 89, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
    color: colors.success,
    fontWeight: '700',
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
});
