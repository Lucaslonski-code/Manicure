import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBlockedTimes } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function BlockedTimesScreen() {
  const { blockedTimes, loading } = useBlockedTimes(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.reason}>{item.reason || 'Bloqueio'}</Text>
      <Text style={styles.time}>
        {format(parseISO(item.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </Text>
      <Text style={styles.time}>
        até {format(parseISO(item.end_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bloqueios</Text>
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : blockedTimes.length === 0 ? (
        <Text style={styles.empty}>Nenhum bloqueio cadastrado.</Text>
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
  title: {
    ...typography.headingLarge,
    padding: spacing.lg,
  },
  loading: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  empty: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reason: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  time: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
