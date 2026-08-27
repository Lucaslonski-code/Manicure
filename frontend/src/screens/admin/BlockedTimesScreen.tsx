import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBlockedTimes } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';

export default function BlockedTimesScreen() {
  const { blockedTimes, loading, error, refetch } = useBlockedTimes(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <Ionicons name="lock-closed-outline" size={iconSizes.md} color={colors.error} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.reason}>{item.reason || 'Bloqueio'}</Text>
        <Text style={styles.time}>
          {format(parseISO(item.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
        <Text style={styles.timeEnd}>
          até {format(parseISO(item.end_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingState message="Carregando bloqueios..." />;
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
      <ScreenHeader title="Bloqueios" subtitle="Horários indisponíveis" />
      {blockedTimes.length === 0 ? (
        <EmptyState title="Sem bloqueios" description="Nenhum bloqueio cadastrado." />
      ) : (
        <FlatList
          data={blockedTimes}
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
    backgroundColor: 'rgba(166, 61, 64, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  reason: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  timeEnd: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
