import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuthContext } from '@hooks/AuthContext';
import { useNotifications } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import DangerButton from '@components/base/DangerButton';
import Avatar from '@components/base/Avatar';

export default function ProfileScreen({ _navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuthContext();
  const { permissionStatus, register, token } = useNotifications();

  const handleToggleNotifications = async () => {
    try {
      if (permissionStatus?.granted) {
        if (token) {
          Alert.alert('Notificações', 'As notificações já estão ativadas para este dispositivo.');
        } else {
          await register();
        }
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await register();
        } else {
          Alert.alert('Notificações', 'As notificações estão desativadas. Você pode habilitá-las nas configurações do aplicativo.');
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerenciar notificações. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 72 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Avatar name={profile?.name} size={80} />
        <Text style={styles.name} numberOfLines={1}>{profile?.name || '—'}</Text>
        <Text style={styles.email} numberOfLines={1}>{profile?.email || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações pessoais</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <AppIcon name="person" size={16} color="gold" />
              <Text style={styles.label}>Nome</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>{profile?.name || '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <AppIcon name="mail" size={16} color="gold" />
              <Text style={styles.label}>E-mail</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>{profile?.email || '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.labelRow}>
              <AppIcon name="phone" size={16} color="gold" />
              <Text style={styles.label}>Telefone</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>{profile?.phone || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleToggleNotifications} activeOpacity={0.7}>
            <View style={styles.labelRow}>
              <AppIcon name="bell" size={16} color="gold" />
              <Text style={styles.label}>Notificações</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueSm}>{token || permissionStatus?.granted ? 'Ativadas' : 'Desativadas'}</Text>
              <AppIcon name="chevron-right" size={16} color="secondary" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <DangerButton title="Sair da conta" onPress={handleLogout} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>AppManicure v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.textPrimary,
    marginTop: 14,
    textAlign: 'center',
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...elevation.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowDivider: { height: 1, backgroundColor: colors.border, opacity: 0.6, marginHorizontal: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  label: { fontSize: 13, color: colors.textSecondary },
  value: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: 160 },
  valueSm: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  footer: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  version: { fontSize: 11, color: colors.textSecondary },
});
