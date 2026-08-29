import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';

export default function BookingConfirmationScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AppIcon name="check" size={iconSizes.xl} color="success" />
      </View>
      <Text style={styles.title}>Agendamento confirmado!</Text>
      <Text style={styles.text}>
        Seu agendamento foi realizado com sucesso. Você receberá uma notificação antes do horário.
      </Text>
      <View style={styles.actions}>
        <Button
          title="Ver meus agendamentos"
          onPress={() => navigation.replace('MyAppointments')}
          style={styles.primaryAction}
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
    padding: spacing.screenPadding,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: radius.modal,
    backgroundColor: 'rgba(74, 124, 89, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxxl,
    ...elevation.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xxxxxxl,
    textAlign: 'center',
  },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xxxxxxl,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.xxxxxxl,
  },
  primaryAction: {
    ...elevation.sm,
  },
});
