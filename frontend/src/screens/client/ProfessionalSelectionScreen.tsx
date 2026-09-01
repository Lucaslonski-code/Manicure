import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfessionals } from '@hooks';
import { colors, spacing, radius, elevation, typography } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import ScreenHeader from '@components/base/ScreenHeader';
import Avatar from '@components/base/Avatar';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import type { Professional } from '../../supabase/types';

export default function ProfessionalSelectionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionals, loading, error } = useProfessionals();

  const handleSelect = (professional: Professional) => {
    navigation.navigate('ServiceSelection', { professionalId: professional.id });
  };

  if (loading) {
    return <LoadingState message="Carregando profissionais..." />;
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (professionals.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <EmptyState title="Nenhum profissional disponível" description="Tente novamente mais tarde." />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Professional }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <Avatar name={item.display_name} size={56} />
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{item.display_name}</Text>
        <Text style={styles.sub}>Toque para escolher data</Text>
      </View>
      <AppIcon name="chevron-right" size={16} color="secondary" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Escolha o profissional" subtitle="Quem vai te atender" />
      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  list: { paddingHorizontal: spacing.screenPadding },
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
  cardContent: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  error: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
});
