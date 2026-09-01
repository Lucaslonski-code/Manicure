import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';

export default function BookingConfirmationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
      <View style={styles.iconWrap}>
        <AppIcon name="check" size={32} color="gold" />
      </View>
      <Text style={styles.title}>Agendamento confirmado</Text>
      <Text style={styles.body}>
        Seu horário foi reservado com sucesso. Você receberá uma confirmação e um lembrete antes do atendimento.
      </Text>
      <View style={styles.actions}>
        <Button title="Ver meus agendamentos" onPress={() => navigation.navigate('ClientTabs', { screen: 'MyAppointments' })} />
        <SecondaryButton title="Voltar ao início" onPress={() => navigation.navigate('ClientTabs', { screen: 'Home' })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...elevation.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
});
