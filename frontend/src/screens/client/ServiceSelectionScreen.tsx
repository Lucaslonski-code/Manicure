import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfessionalServices, useProfessional } from '@hooks';
import { colors, spacing, typography, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';
import LoadingState from '@components/base/LoadingState';
import type { Service } from '../../supabase/types';
import Button from '@components/base/Button';

export default function ServiceSelectionScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId } = route.params as { professionalId: string };
  const { items, loading, error } = useProfessionalServices(professionalId);
  const { professional } = useProfessional(professionalId);

  const renderService = ({ item }: { item: Service & { duration_minutes?: number; price?: number } }) => {
    const ps = items.find((i) => i.service_id === item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DateSelection', { professionalId, serviceId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.serviceIcon}>
          <AppIcon name="sparkles" size={20} color="gold" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.duration}>{ps?.duration_minutes ?? item.default_duration_minutes} min</Text>
            {ps?.price != null && (
              <Text style={styles.price}>R$ {Number(ps.price).toFixed(2)}</Text>
            )}
          </View>
        </View>
        <AppIcon name="chevron-right" size={16} color="secondary" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingState message="Carregando serviços..." />;
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Tentar novamente" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Serviços" subtitle="Escolha o serviço desejado" />
      {professional && (
        <View style={styles.chipWrap}>
          <View style={styles.professionalChip}>
            <AppIcon name="user" size={16} color="gold" />
            <Text style={styles.professionalName} numberOfLines={1}>{professional.display_name}</Text>
          </View>
        </View>
      )}
      <FlatList
        data={items.map((i) => i.service)}
        keyExtractor={(item) => item.id}
        renderItem={renderService}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
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
    padding: spacing.screenPadding,
  },
  chipWrap: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 16,
  },
  professionalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  professionalName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  duration: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  price: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gold,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyWrap: {
    paddingTop: 32,
    paddingHorizontal: 16,
  },
});
