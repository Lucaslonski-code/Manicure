import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAvailability } from '@hooks';
import { colors, spacing, typography } from '@theme';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function AvailabilityScreen() {
  const { availability, loading } = useAvailability(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.weekday}>{WEEKDAYS[item.weekday] || item.weekday}</Text>
      <Text style={styles.time}>
        {item.start_time} - {item.end_time}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disponibilidade</Text>
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : availability.length === 0 ? (
        <Text style={styles.empty}>Nenhuma disponibilidade cadastrada.</Text>
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
  weekday: {
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
