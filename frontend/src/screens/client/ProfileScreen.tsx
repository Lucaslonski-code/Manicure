import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@hooks';
import { useNotifications } from '@hooks';
import { colors, spacing, typography } from '@theme';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
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
        const result = await Notifications.requestPermissionsAsync();
        if (result.granted) {
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
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{profile?.name || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{profile?.email || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Telefone</Text>
        <Text style={styles.value}>{profile?.phone || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notificações</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={handleToggleNotifications}>
          <Text style={styles.notificationButtonText}>
            {token || permissionStatus?.granted ? 'Notificações ativadas' : 'Ativar notificações'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  notificationButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  notificationButtonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoutButtonText: {
    ...typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
});
