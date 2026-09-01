import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAllWorkWindows } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';
import type { WorkWindow } from '../../supabase/types';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type WorkWindowWithProfessional = WorkWindow & { professional_name?: string };

export default function AvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const { windows, loading, error, refetch } = useAllWorkWindows();

  const renderItem = ({ item }: { item: WorkWindowWithProfessional }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <AppIcon name="time" size={iconSizes.md} color="gold" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.weekday}>{WEEKDAYS[item.weekday] || item.weekday}</Text>
        <Text style={styles.time}>
          {item.start_time} - {item.end_time}
        </Text>
        {item.professional_name && (
          <Text style={styles.professional}>{item.professional_name}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <LoadingState message="Carregando disponibilidade..." />;
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }] }>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <ScreenHeader title="Disponibilidade" subtitle="Jornada semanal" />
      {windows.length === 0 ? (
        <EmptyState title="Sem disponibilidade" description="Nenhuma jornada cadastrada." />
      ) : (
        <FlatList
          data={windows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxxxxl,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginBottom: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxxxxxl,
  },
  cardContent: {
    flex: 1,
  },
  weekday: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  time: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  professional: {
    ...typography.bodySmall,
    color: colors.gold,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
});
