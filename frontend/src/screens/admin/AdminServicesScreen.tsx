import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useServices } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';
import StatusBadge from '@components/base/StatusBadge';
import ScreenHeader from '@components/base/ScreenHeader';

export default function AdminServicesScreen() {
  const { services, loading, error, refetch } = useServices();

  if (loading) {
    return <LoadingState message="Carregando serviços..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorState message={error} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Serviços" subtitle="Lista de serviços cadastrados" />
      {services.length === 0 ? (
        <EmptyState title="Nenhum serviço" description="Não há serviços cadastrados." />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIconContainer}>
                <AppIcon name="sparkles" size={iconSizes.md} color="gold" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.duration}>{item.default_duration_minutes} min</Text>
                <StatusBadge label={item.is_active ? 'Ativo' : 'Inativo'} variant={item.is_active ? 'gold' : 'default'} />
              </View>
            </View>
          )}
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
    paddingHorizontal: spacing.screenPadding,
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
  name: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  duration: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
