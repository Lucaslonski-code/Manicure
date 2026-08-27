import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAvailability } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AvailabilityScreen() {
  const { availability, loading, error, refetch } = useAvailability(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <Ionicons name="time-outline" size={iconSizes.md} color={colors.gold} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.weekday}>{WEEKDAYS[item.weekday] || item.weekday}</Text>
        <Text style={styles.time}>
          {item.start_time} - {item.end_time}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingState message="Carregando disponibilidade..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Disponibilidade" subtitle="Jornada semanal" />
      {availability.length === 0 ? (
        <EmptyState title="Sem disponibilidade" description="Nenhuma disponibilidade cadastrada." />
      ) : (
        <FlatList
          data={availability}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
    padding: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  weekday: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  time: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
