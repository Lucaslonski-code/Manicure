import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';

const SECTIONS = [
  { key: 'PanelWeeklySchedule', icon: 'calendar' as const, title: 'Jornada semanal', description: 'Configure os dias e horarios de trabalho recorrentes.' },
  { key: 'PanelSpecificDates', icon: 'time' as const, title: 'Datas especificas', description: 'Defina excecoes, folgas e horarios especiais para datas pontuais.' },
  { key: 'PanelBlockedTimes', icon: 'lock' as const, title: 'Bloqueios', description: 'Registre indisponibilidades extraordinarias.' },
] as const;

export default function ScheduleCustomizationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppIcon name="chevron-left" size={20} color="secondary" />
        </TouchableOpacity>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle}>Personalizar agenda</Text>
          <Text style={styles.topBarSub}>Configure a disponibilidade</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={styles.card}
              onPress={() => navigation.navigate(section.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <AppIcon name={section.icon} size={24} color="gold" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
              </View>
              <AppIcon name="chevron-right" size={16} color="secondary" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: spacing.sm },
  topBarTitleWrap: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  topBarSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.lg, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardContent: { flex: 1 },
  cardTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  cardDescription: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
});
