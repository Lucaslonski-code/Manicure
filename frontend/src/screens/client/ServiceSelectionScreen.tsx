import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useProfessionalServices, useProfessional } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';
import type { Service } from '../../supabase/types';
import Button from '@components/base/Button';

export default function ServiceSelectionScreen({ route, navigation }: any) {
  const { professionalId } = route.params;
  const { items, loading, error } = useProfessionalServices(professionalId);
  const { professional } = useProfessional(professionalId);

  const services = items.map(item => item.service);

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DateSelection', { professionalId, serviceId: item.id })}
    >
      <View style={styles.serviceIconContainer}>
        <AppIcon name="sparkles" size={iconSizes.md} color="gold" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.duration}>{item.default_duration_minutes} min</Text>
      </View>
      <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Carregando serviços...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Tentar novamente" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Serviços"
        subtitle="Escolha o serviço desejado"
      />
      {professional && (
        <View style={styles.professionalChip}>
          <AppIcon name="user" size={iconSizes.sm} color="gold" />
          <Text style={styles.professionalName}>{professional.display_name}</Text>
        </View>
      )}
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>Nenhum serviço disponível para este profissional.</Text>
          </View>
        }
      />
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
  professionalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldOverlay,
    paddingHorizontal: spacing.xxxxxxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginHorizontal: spacing.xxxxxxl,
    marginBottom: spacing.xxxxxxl,
  },
  professionalName: {
    ...typography.bodySmall,
    color: colors.gold,
    fontWeight: '600',
    marginLeft: spacing.xs,
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
    justifyContent: 'space-between',
    ...elevation.sm,
  },
  serviceIconContainer: {
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
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  duration: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chevron: {
    ...typography.title,
    color: colors.textSecondary,
    marginLeft: spacing.xxxxxxl,
  },
  loading: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
  empty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
