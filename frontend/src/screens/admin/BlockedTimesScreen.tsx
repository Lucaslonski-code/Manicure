import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBlockedTimes } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ScreenHeader from '@components/base/ScreenHeader';

export default function BlockedTimesScreen() {
  const insets = useSafeAreaInsets();
  const { blockedTimes, loading, error, refetch } = useBlockedTimes(null);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <AppIcon name="lock" size={iconSizes.md} color="error" />
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
      <View style={[styles.center, { paddingTop: insets.top + 24 }] }>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar novamente" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }] }>
      <ScreenHeader title="Bloqueios" subtitle="Horários indisponíveis" />
      {blockedTimes.length === 0 ? (
        <EmptyState title="Sem bloqueios" description="Nenhum bloqueio cadastrado." />
      ) : (
        <FlatList
          data={blockedTimes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
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
    padding: spacing.xxxxxxl,
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
    ...elevation.sm,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: 'rgba(166, 61, 64, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxxxxxl,
  },
  cardContent: {
    flex: 1,
  },
  reason: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  timeEnd: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xxxxxxl,
  },
});
