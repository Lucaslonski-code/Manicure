import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthContext } from '@hooks/AuthContext';
import { useNotifications } from '@hooks';
import { colors, spacing, typography, radius, elevation, iconSizes } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import DangerButton from '@components/base/DangerButton';
import Divider from '@components/base/Divider';
import Avatar from '@components/base/Avatar';
import ScreenHeader from '@components/base/ScreenHeader';

export default function AdminProfileScreen({ _navigation }: any) {
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
          Alert.alert(
            'Notificações',
            'As notificações estão desativadas. Você pode habilitá-las nas configurações do aplicativo.'
          );
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
    <ScrollView style={styles.container}>
      <ScreenHeader title="Perfil" subtitle="Área administrativa" />
      <View style={styles.section}>
        <View style={styles.avatarRow}>
          <Avatar name={profile?.name} size={88} borderColor={colors.goldLight} />
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile?.name || '—'}</Text>
            <Text style={styles.email}>{profile?.email || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações pessoais</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconLabelRow}>
              <AppIcon name="user" size={iconSizes.sm} color="gold" />
              <Text style={styles.label}>Nome</Text>
            </View>
            <Text style={styles.value}>{profile?.name || '—'}</Text>
          </View>
          <Divider gold />
          <View style={styles.row}>
            <View style={styles.iconLabelRow}>
              <AppIcon name="mail" size={iconSizes.sm} color="gold" />
              <Text style={styles.label}>E-mail</Text>
            </View>
            <Text style={styles.value}>{profile?.email || '—'}</Text>
          </View>
          <Divider gold />
          <View style={styles.row}>
            <View style={styles.iconLabelRow}>
              <AppIcon name="phone" size={iconSizes.sm} color="gold" />
              <Text style={styles.label}>Telefone</Text>
            </View>
            <Text style={styles.value}>{profile?.phone || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleToggleNotifications}>
            <View style={styles.iconLabelRow}>
              <AppIcon name="bell" size={iconSizes.sm} color="gold" />
              <Text style={styles.label}>Notificações</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {token || permissionStatus?.granted ? 'Ativadas' : 'Desativadas'}
              </Text>
              <AppIcon name="chevron-right" size={iconSizes.sm} color="secondary" />
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxxxxxl,
  },
  identityText: {
    flex: 1,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.xxxxxxl,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xxxxxxl,
    paddingHorizontal: spacing.screenPadding,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
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
    padding: spacing.xxxxxxl,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  value: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
  },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
