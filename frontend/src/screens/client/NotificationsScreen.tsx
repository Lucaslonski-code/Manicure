import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationsHistory } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';
import ScreenHeader from '@components/base/ScreenHeader';

const typeLabels: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  confirmation: { label: 'Confirmação', color: colors.success, icon: 'checkmark-circle-outline' },
  reschedule: { label: 'Reagendamento', color: colors.warning, icon: 'calendar-outline' },
  cancellation: { label: 'Cancelamento', color: colors.error, icon: 'close-circle-outline' },
  reminder: { label: 'Lembrete', color: colors.textSecondary, icon: 'time-outline' },
};

export default function NotificationsScreen() {
  const { notifications, loading, error, refetch } = useNotificationsHistory();

  const renderItem = ({ item }: { item: any }) => {
    const typeInfo = typeLabels[item.type] || { label: item.type, color: colors.textSecondary, icon: 'notifications-outline' };

    return (
      <View style={styles.item}>
        <View style={styles.itemIconContainer}>
          <Ionicons name={typeInfo.icon} size={iconSizes.md} color={typeInfo.color} />
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
    padding: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...elevation.sm,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  text: {
    ...typography.bodyMedium,
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
