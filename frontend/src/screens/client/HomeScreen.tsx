import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useProfessionals, useMyAppointments, useServices } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Avatar from '@components/base/Avatar';
import Button from '@components/base/Button';
import SectionHeader from '@components/base/SectionHeader';
import StatusBadge from '@components/base/StatusBadge';
import type { Professional, Service } from '../../supabase/types';

const LOGO = require('../../../assets/IconAppWhite.png');

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
      <Avatar name={item.display_name} size={64} borderColor={colors.goldLight} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.specialty}>Especialista</Text>
      </View>
      <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
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
        <AppIcon name="sparkles" size={iconSizes.md} color="gold" />
      </View>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceDuration}>{item.default_duration_minutes} min</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
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
                <AppIcon name="calendar" size={iconSizes.lg} color="gold" />
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
              <AppIcon name="calendar" size={iconSizes.lg} color="gold" />
            </View>
            <Text style={styles.shortcutLabel}>Meus agendamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.shortcutIconContainer}>
              <AppIcon name="user" size={iconSizes.lg} color="gold" />
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xxxxxxxl,
    paddingBottom: spacing.xxxxxxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxxxxxl,
  },
  logoImage: {
    width: 28,
    height: 19,
    marginRight: spacing.sm,
  },
  brand: {
    ...typography.section,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  nextAppointment: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.xxxxxxl,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
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
    marginRight: spacing.xxxxxxl,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentProfessional: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  appointmentDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  appointmentTime: {
    ...typography.bodySmall,
    color: colors.gold,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  ctaSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xxxxxxxl,
  },
  ctaButton: {
    ...elevation.sm,
  },
  section: {
    marginBottom: spacing.xxxxxxxl,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
  },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginRight: spacing.xxxxxxl,
    borderWidth: 1,
    borderColor: colors.border,
    width: 200,
    ...elevation.sm,
  },
  cardContent: {
    marginLeft: spacing.xxxxxxl,
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  specialty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    marginRight: spacing.xxxxxxl,
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
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  serviceDuration: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  shortcuts: {
    marginBottom: spacing.xxxxxxxl,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xxxxxxl,
  },
  shortcut: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxxxxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.sm,
  },
  shortcutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  shortcutLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  spacer: {
    height: spacing.xxxxxl,
  },
});
