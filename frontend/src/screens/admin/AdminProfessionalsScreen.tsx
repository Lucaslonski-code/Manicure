import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useProfessionals } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';

export default function AdminProfessionalsScreen() {
  const { professionals, loading, error, refetch } = useProfessionals();

  if (loading) {
    return <LoadingState message="Carregando profissionais..." />;
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
      <View style={styles.header}>
        <Text style={styles.title}>Profissionais</Text>
        <Text style={styles.subtitle}>Lista de profissionais cadastrados</Text>
      </View>

      {professionals.length === 0 ? (
        <EmptyState title="Nenhum profissional" description="Não há profissionais cadastrados." />
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.status}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
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
  status: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
