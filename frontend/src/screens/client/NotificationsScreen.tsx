import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationsHistory } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon, { type IconName } from '@components/icons/AppIcon';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';
import ScreenHeader from '@components/base/ScreenHeader';

const typeLabels: Record<string, { label: string; color: string; icon: IconName }> = {
  confirmation: { label: 'Confirmação', color: colors.success, icon: 'check' },
  reschedule: { label: 'Reagendamento', color: colors.warning, icon: 'calendar' },
  cancellation: { label: 'Cancelamento', color: colors.error, icon: 'error' },
  reminder: { label: 'Lembrete', color: colors.textSecondary, icon: 'time' },
};

export default function NotificationsScreen() {
  const { notifications, loading, error, refetch } = useNotificationsHistory();

  const renderItem = ({ item }: { item: any }) => {
    const typeInfo = typeLabels[item.type] || { label: item.type, color: colors.textSecondary, icon: 'bell' };

    return (
      <View style={styles.item}>
        <View style={styles.itemIconContainer}>
          <AppIcon name={typeInfo.icon} size={iconSizes.md} color={typeInfo.color as 'primary' | 'secondary' | 'gold' | 'success' | 'error' | 'warning' | 'disabled' | 'surface'} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.typeLabel}>{typeInfo.label}</Text>
            <Text style={styles.date}>
              {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          </View>
          <Text style={styles.text}>
            {item.type === 'confirmation' && 'Seu agendamento foi confirmado.'}
            {item.type === 'cancellation' && 'Um agendamento foi cancelado.'}
            {item.type === 'reschedule' && 'Um agendamento foi reagendado.'}
            {item.type === 'reminder' && 'Lembrete de agendamento.'}
          </Text>
          {item.sent_at && (
            <Text style={styles.sentAt}>
              Enviada em {format(parseISO(item.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Carregando notificações..." />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorState message={error} onRetry={refetch} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Nenhuma notificação"
          description="Você não tem notificações no momento."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notificações" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxxl,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginBottom: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...elevation.sm,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xxxxxxl,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sentAt: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
