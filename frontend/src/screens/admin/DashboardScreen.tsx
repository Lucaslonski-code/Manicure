import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useProfessionals } from '@hooks';
import { colors, spacing, typography } from '@theme';

export default function DashboardScreen({ navigation }: any) {
  const { appointments } = useAppointments();
  const { professionals } = useProfessionals();

  const upcomingAppointments = appointments
    .filter(a => a.status === 'confirmed' && new Date(a.start_at) > new Date())
    .slice(0, 5);

  const renderAppointment = ({ item }: { item: any }) => {
    const professional = professionals.find(p => p.id === item.professional_id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
      >
        <Text style={styles.professional}>{professional?.display_name || 'Profissional'}</Text>
        <Text style={styles.date}>
          {format(parseISO(item.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Text>
        <Text style={styles.status}>{item.status}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Próximos atendimentos</Text>
      {upcomingAppointments.length === 0 ? (
        <Text style={styles.empty}>Nenhum agendamento próximo.</Text>
      ) : (
        <FlatList
          data={upcomingAppointments}
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
  subtitle: {
    ...typography.headingMedium,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
