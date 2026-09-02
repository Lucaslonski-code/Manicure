import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';

const SECTIONS = [
  {
    key: 'PanelWeeklySchedule',
    icon: 'calendar' as const,
    title: 'Jornada semanal',
    description: 'Configure os dias e horarios de trabalho recorrentes.',
  },
  {
    key: 'PanelSpecificDates',
    icon: 'time' as const,
    title: 'Datas especificas',
    description: 'Defina excecoes, folgas e horarios especiais para datas pontuais.',
  },
  {
    key: 'PanelBlockedTimes',
    icon: 'lock' as const,
    title: 'Bloqueios',
    description: 'Registre indisponibilidades extraordinarias como emergencias e compromissos.',
  },
] as const;

export default function ScheduleCustomizationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Personalizar agenda" subtitle="Configure a disponibilidade" onBack={() => navigation.goBack()} />

      <View style={styles.list}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.card}
            onPress={() => navigation.navigate(section.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <AppIcon name={section.icon} size={iconSizes.md} color="gold" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardDescription}>{section.description}</Text>
            </View>
            <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxxxxxl,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
