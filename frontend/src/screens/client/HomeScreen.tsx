import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useProfessionals, useMyAppointments, useServices } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import Avatar from '@components/base/Avatar';
import Button from '@components/base/Button';
import SectionHeader from '@components/base/SectionHeader';
import type { Professional, Service } from '../../supabase/types';

export default function HomeScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { professionals } = useProfessionals();
  const { appointments } = useMyAppointments();
  const { services } = useServices();

  const handleSelectProfessional = (professional: Professional) => {
    navigation.navigate('ServiceSelection', { professionalId: professional.id });
  };

  const now = new Date();
  const nextAppointment = appointments
    .filter((a) => new Date(a.start_at) > now && a.status === 'confirmed')
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const renderProfessional = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectProfessional(item)}
    >
      <Avatar name={item.display_name} size={48} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.specialty}>Profissional</Text>
      </View>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        const prof = professionals[0];
        if (prof) navigation.navigate('ServiceSelection', { professionalId: prof.id });
      }}
    >
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceDuration}>{item.default_duration_minutes} min</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.brand}>AppManicure</Text>
        <Text style={styles.greeting}>{greeting()}, {profile?.name?.split(' ')[0] || 'cliente'}</Text>
        <Text style={styles.subtitle}>Encontre o melhor horário para você</Text>
      </View>

      {nextAppointment && (
        <View style={styles.nextAppointment}>
          <SectionHeader
            title="Próximo agendamento"
            subtitle="Não perca seu horário"
          />
          <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppointment.id })}
          >
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentProfessional}>
                {professionals.find((p) => p.id === nextAppointment.professional_id)?.display_name || 'Profissional'}
              </Text>
              <Text style={styles.appointmentDate}>
                {new Date(nextAppointment.start_at).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </Text>
              <Text style={styles.appointmentTime}>
                {new Date(nextAppointment.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Confirmado</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.ctaSection}>
        <Button
          title="Agendar horário"
          onPress={() => navigation.navigate('ServiceSelection', { professionalId: professionals[0]?.id || '' })}
          disabled={professionals.length === 0}
        />
      </View>

      {professionals.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Profissionais" />
          <FlatList
            data={professionals.slice(0, 4)}
            keyExtractor={(item) => item.id}
            renderItem={renderProfessional}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {services.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Serviços" />
          <FlatList
            data={services.slice(0, 4)}
            keyExtractor={(item) => item.id}
            renderItem={renderService}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      <View style={styles.shortcuts}>
        <SectionHeader title="Atalhos" />
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('MyAppointments')}>
            <Text style={styles.shortcutIcon}>📋</Text>
            <Text style={styles.shortcutLabel}>Meus agendamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.shortcutIcon}>👤</Text>
            <Text style={styles.shortcutLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  nextAppointment: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentProfessional: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  appointmentDate: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  appointmentTime: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  statusContainer: {
    marginLeft: spacing.md,
  },
  statusBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.label,
    color: colors.success,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: 200,
  },
  cardContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: 160,
  },
  serviceName: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  serviceDuration: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  shortcuts: {
    marginBottom: spacing.lg,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  shortcut: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  shortcutLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  spacer: {
    height: spacing.xl,
  },
});
