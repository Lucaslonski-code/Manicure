import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@hooks/AuthContext';
import { useProfessionals, useMyAppointments, useServices } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Avatar from '@components/base/Avatar';
import Button from '@components/base/Button';
import type { Professional, Service } from '../../supabase/types';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();
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

  const firstName = profile?.name?.split(' ')[0] || 'cliente';

  const renderProfessional = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.professionalItem}
      onPress={() => handleSelectProfessional(item)}
      activeOpacity={0.7}
    >
      <Avatar name={item.display_name} size={68} />
      <Text style={styles.professionalName} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        const prof = professionals[0];
        if (prof) navigation.navigate('ServiceSelection', { professionalId: prof.id });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.serviceImageArea}>
        <AppIcon name="sparkles" size={24} color="gold" />
      </View>
      <View style={styles.serviceTextArea}>
        <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.serviceDuration}>{item.default_duration_minutes} min</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Saudação — spec: 24-26 / 600 #25221F left, subtitle 14 #6F6256 gap 6-8 */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>Bem-vinda, {firstName}</Text>
        <Text style={styles.subtitle}>Seu momento de autocuidado começa aqui</Text>
      </View>

      {/* Card próximo horário — surface clara, border 1px #E3D5C6, radius 16, padding 16 */}
      {nextAppointment ? (
        <View style={styles.nextBlock}>
          <TouchableOpacity
            style={styles.nextCard}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppointment.id })}
            activeOpacity={0.7}
          >
            <View style={styles.nextTextArea}>
              <Text style={styles.nextLabel}>Próximo horário</Text>
              <Text style={styles.nextDateTime}>
                {new Date(nextAppointment.start_at).toLocaleDateString('pt-BR', { weekday: 'long' })} ·{' '}
                {new Date(nextAppointment.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.nextProfessional} numberOfLines={1}>
                {professionals.find((p) => p.id === nextAppointment.professional_id)?.display_name || 'Profissional'}
              </Text>
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>Confirmado</Text>
              </View>
            </View>
            <View style={styles.nextImageArea}>
              <AppIcon name="calendar" size={28} color="gold" />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* CTA — bronze, 48-50, radius 12-14, 100% width */}
      <View style={styles.ctaBlock}>
        <Button
          title="Agendar novo horário"
          onPress={() => navigation.navigate('ServiceSelection', { professionalId: professionals[0]?.id || '' })}
          disabled={professionals.length === 0}
        />
      </View>

      {/* Profissionais — header 16-18 600 #25221F + Ver todas 11-12 bronze, lista horizontal 64-72 circular */}
      {professionals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profissionais</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServiceSelection', { professionalId: professionals[0]?.id || '' })}>
              <Text style={styles.sectionLink}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={professionals}
            keyExtractor={(item) => item.id}
            renderItem={renderProfessional}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Serviços — mesmo padrão header, cards horizontal image-first */}
      {services.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Serviços em destaque</Text>
            <TouchableOpacity
              onPress={() => {
                const prof = professionals[0];
                if (prof) navigation.navigate('ServiceSelection', { professionalId: prof.id });
              }}
            >
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderService}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  // Saudação
  greetingBlock: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  // Próximo horário
  nextBlock: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 16,
  },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  nextTextArea: {
    flex: 0.7,
    paddingRight: 12,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  nextDateTime: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  nextProfessional: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  nextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(185,155,104,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: colors.gold,
  },
  nextImageArea: {
    flex: 0.3,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // CTA
  ctaBlock: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 28,
  },
  // Seções
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.1,
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gold,
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
    gap: 16,
  },
  // Profissional item — circular 68, nome 11-12 centrado
  professionalItem: {
    alignItems: 'center',
    width: 72,
  },
  professionalName: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Serviço card — image-first, radius 12-14, border 1px
  serviceCard: {
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...elevation.sm,
  },
  serviceImageArea: {
    height: 92,
    backgroundColor: colors.goldOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTextArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 16,
  },
});
