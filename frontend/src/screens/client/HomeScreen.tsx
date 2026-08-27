import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useProfessionals, useMyAppointments, useServices } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@components/base/Avatar';
import Button from '@components/base/Button';
import SectionHeader from '@components/base/SectionHeader';
import StatusBadge from '@components/base/StatusBadge';
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
      style={styles.professionalCard}
      onPress={() => handleSelectProfessional(item)}
    >
      <Avatar name={item.display_name} size={56} borderColor={colors.goldLight} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.specialty}>Especialista</Text>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.sm} color={colors.textSecondary} />
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
      <View style={styles.serviceIconContainer}>
        <Ionicons name="sparkles-outline" size={iconSizes.md} color={colors.gold} />
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceDuration}>{item.default_duration_minutes} min</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brand}>AppManicure</Text>
        </View>
        <Text style={styles.greeting}>{greeting()}, {profile?.name?.split(' ')[0] || 'cliente'}</Text>
        <Text style={styles.subtitle}>Seu momento de cuidado começa aqui</Text>
      </View>

      {nextAppointment && (
        <View style={styles.nextAppointment}>
          <SectionHeader
            title="Próximo agendamento"
            subtitle="Não perca seu horário"
            accent
          />
          <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppointment.id })}
          >
            <View style={styles.appointmentLeft}>
              <View style={styles.appointmentIconContainer}>
                <Ionicons name="calendar-outline" size={iconSizes.lg} color={colors.gold} />
              </View>
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
            </View>
            <StatusBadge label="Confirmado" variant="gold" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.ctaSection}>
        <Button
          title="Agendar horário"
          onPress={() => navigation.navigate('ServiceSelection', { professionalId: professionals[0]?.id || '' })}
          disabled={professionals.length === 0}
          style={styles.ctaButton}
        />
      </View>

      {professionals.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Profissionais" subtitle="Conheça nossa equipe" />
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
          <SectionHeader title="Serviços" subtitle="Tratamentos exclusivos" />
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
            <View style={styles.shortcutIconContainer}>
              <Ionicons name="calendar-outline" size={iconSizes.lg} color={colors.gold} />
            </View>
            <Text style={styles.shortcutLabel}>Meus agendamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.shortcutIconContainer}>
              <Ionicons name="person-outline" size={iconSizes.lg} color={colors.gold} />
            </View>
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
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...elevation.sm,
  },
  logoText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brand: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  greeting: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
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
    ...elevation.sm,
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    color: colors.gold,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    ...elevation.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
  },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: 200,
    ...elevation.sm,
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
    ...elevation.sm,
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  shortcutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  shortcutLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  spacer: {
    height: spacing.xxl,
  },
});
