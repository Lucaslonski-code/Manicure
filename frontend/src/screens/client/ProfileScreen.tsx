import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@hooks';
import { useNotifications } from '@hooks';
import { colors, spacing, typography, radius } from '@theme';
import DangerButton from '@components/base/DangerButton';
import Divider from '@components/base/Divider';
import Avatar from '@components/base/Avatar';

export default function ProfileScreen({ _navigation }: any) {
  const { profile, signOut } = useAuth();
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
      <View style={styles.header}>
        <Avatar name={profile?.name} size={80} />
        <Text style={styles.name}>{profile?.name || '—'}</Text>
        <Text style={styles.email}>{profile?.email || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações pessoais</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{profile?.name || '—'}</Text>
          </View>
          <Divider />
          <View style={styles.row}>
            <Text style={styles.label}>E-mail</Text>
            <Text style={styles.value}>{profile?.email || '—'}</Text>
          </View>
          <Divider />
          <View style={styles.row}>
            <Text style={styles.label}>Telefone</Text>
            <Text style={styles.value}>{profile?.phone || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleToggleNotifications}>
            <Text style={styles.label}>Notificações</Text>
            <Text style={styles.value}>
              {token || permissionStatus?.granted ? 'Ativadas' : 'Desativadas'}
            </Text>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  name: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  email: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
