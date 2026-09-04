import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuthContext } from '@hooks/AuthContext';
import { useNotifications, useUpdateProfile } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import DangerButton from '@components/base/DangerButton';
import Button from '@components/base/Button';
import Avatar from '@components/base/Avatar';
import ScreenHeader from '@components/base/ScreenHeader';

export default function AdminProfileScreen({ _navigation }: any) {
  const insets = useSafeAreaInsets();
  const { profile, signOut, setProfile } = useAuthContext();
  const { permissionStatus, register, token } = useNotifications();
  const { update: updateProfileFn, loading: profileLoading } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');

  const handleToggleNotifications = async () => {
    try {
      if (permissionStatus?.granted) {
        if (token) Alert.alert('Notificações', 'As notificações já estão ativadas para este dispositivo.');
        else await register();
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') await register();
        else Alert.alert('Notificações', 'As notificações estão desativadas. Você pode habilitá-las nas configurações do aplicativo.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerenciar notificações. Tente novamente.');
    }
  };

  const handleStartEdit = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Erro', 'O nome nao pode estar vazio.');
      return;
    }
    try {
      await updateProfileFn(profile.id, { name: trimmedName, phone: editPhone.trim() });
      setProfile({ ...profile, name: trimmedName, phone: editPhone.trim() });
      setEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel atualizar o perfil.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { try { await signOut(); } catch { Alert.alert('Erro', 'Não foi possível sair. Tente novamente.'); } } },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Perfil" subtitle="Área administrativa" />
      <View style={styles.identityBlock}>
        <Avatar name={profile?.name} size={72} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>{profile?.name || '—'}</Text>
          <Text style={styles.email} numberOfLines={1}>{profile?.email || '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>
          {!editing && (
            <TouchableOpacity onPress={handleStartEdit} activeOpacity={0.7}>
              <AppIcon name="edit" size={16} color="gold" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.labelRow}><AppIcon name="user" size={16} color="gold" /><Text style={styles.label}>Nome</Text></View>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor={colors.disabled}
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{profile?.name || '—'}</Text>
            )}
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.labelRow}><AppIcon name="mail" size={16} color="gold" /><Text style={styles.label}>E-mail</Text></View>
            <Text style={styles.value} numberOfLines={1}>{profile?.email || '—'}</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.labelRow}><AppIcon name="phone" size={16} color="gold" /><Text style={styles.label}>Telefone</Text></View>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Telefone"
                placeholderTextColor={colors.disabled}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value} numberOfLines={1}>{profile?.phone || '—'}</Text>
            )}
          </View>
        </View>
        {editing && (
          <View style={styles.editActions}>
            <Button
              title={profileLoading ? 'Salvando...' : 'Salvar'}
              onPress={handleSaveProfile}
              disabled={profileLoading}
              loading={profileLoading}
            />
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn} activeOpacity={0.7}>
              <Text style={styles.cancelEditText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleToggleNotifications} activeOpacity={0.7}>
            <View style={styles.labelRow}><AppIcon name="bell" size={16} color="gold" /><Text style={styles.label}>Notificações</Text></View>
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

      <View style={styles.footer}><Text style={styles.version}>AppManicure v1.0.0</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 20,
  },
  identityText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, color: colors.textPrimary },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 20, paddingHorizontal: spacing.screenPadding },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...elevation.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 48 },
  rowDivider: { height: 1, backgroundColor: colors.border, opacity: 0.6, marginHorizontal: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  label: { fontSize: 13, color: colors.textSecondary },
  value: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: 160 },
  valueSm: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.background,
    maxWidth: 180,
  },
  editActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cancelEditBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelEditText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: { paddingVertical: 12 },
  version: { fontSize: 11, color: colors.textSecondary },
});
