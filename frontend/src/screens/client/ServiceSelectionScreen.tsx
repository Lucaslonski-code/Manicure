import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useProfessionalServices } from '@hooks';
import { colors, spacing, typography } from '@theme';
import type { Service } from '../../supabase/types';

export default function ServiceSelectionScreen({ route, navigation }: any) {
  const { professionalId } = route.params;
  const { items, loading } = useProfessionalServices(professionalId);

  const services = items.map(item => item.service);

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DateSelection', { professionalId, serviceId: item.id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.duration}>{item.default_duration_minutes} min</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Serviços</Text>
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
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
  name: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  duration: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
