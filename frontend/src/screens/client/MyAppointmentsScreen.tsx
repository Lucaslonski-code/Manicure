import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMyAppointments } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function MyAppointmentsScreen({ navigation }: any) {
  const { appointments, loading } = useMyAppointments();

  const renderAppointment = ({ item }: { item: any }) => {
    const statusLabel = item.status === 'confirmed' ? 'Confirmado' : item.status === 'cancelled' ? 'Cancelado' : 'Concluído';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
      >
        <Text style={styles.professional}>Profissional</Text>
        <Text style={styles.date}>
          {format(parseISO(item.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
        <Text style={styles.status}>Status: {statusLabel}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus agendamentos</Text>
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : appointments.length === 0 ? (
        <Text style={styles.empty}>Nenhum agendamento encontrado.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
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
  professional: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  date: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  status: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
