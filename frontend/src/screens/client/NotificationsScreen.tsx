import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationsHistory } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ErrorState from '@components/base/ErrorState';

const typeLabels: Record<string, { label: string; color: string }> = {
  confirmation: { label: 'Confirmação', color: colors.success },
  reschedule: { label: 'Reagendamento', color: colors.warning },
  cancellation: { label: 'Cancelamento', color: colors.error },
  reminder: { label: 'Lembrete', color: colors.textSecondary },
};

export default function NotificationsScreen() {
  const { notifications, loading, error, refetch } = useNotificationsHistory();

  const renderItem = ({ item }: { item: any }) => {
    const typeInfo = typeLabels[item.type] || { label: item.type, color: colors.textSecondary };

    return (
      <View style={styles.item}>
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
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
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
  },
  sentAt: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
