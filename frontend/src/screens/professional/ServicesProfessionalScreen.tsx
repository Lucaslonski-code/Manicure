import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyProfessionalId, useProfessionalServices, useCreateServiceForProfessional, useDeleteProfessionalService } from '@hooks';
import { colors, spacing, radius, elevation, typography } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ConfirmationDialog from '@components/base/ConfirmationDialog';

export default function ServicesProfessionalScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, loading: pidLoading } = useMyProfessionalId();
  const { items, loading: servicesLoading, refetch } = useProfessionalServices(professionalId);
  const { create, loading: creating } = useCreateServiceForProfessional();
  const { remove, loading: deleting } = useDeleteProfessionalService();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<{ name?: string; duration?: string }>({});

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState('');

  const loading = pidLoading || servicesLoading;

  if (loading) return <LoadingState message="Carregando servicos..." />;

  if (!professionalId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nao foi possivel identificar o profissional.</Text>
      </View>
    );
  }

  const validate = (): boolean => {
    const newErrors: { name?: string; duration?: string } = {};
    if (!name.trim()) newErrors.name = 'Nome obrigatorio';
    const dur = parseInt(duration, 10);
    if (!duration || isNaN(dur) || dur <= 0) newErrors.duration = 'Duracao invalida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await create(professionalId, name.trim(), description.trim() || null, parseInt(duration, 10), price ? parseFloat(price) : null);
      setName('');
      setDescription('');
      setDuration('');
      setPrice('');
      setErrors({});
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Nao foi possivel criar o servico.');
    }
  };

  const handleDeleteRequest = (id: string, serviceName: string) => {
    setPendingDeleteId(id);
    setPendingDeleteLabel(serviceName);
    setConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await remove(pendingDeleteId);
      setConfirmVisible(false);
      setPendingDeleteId(null);
      setPendingDeleteLabel('');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Nao foi possivel excluir o servico.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppIcon name="chevron-left" size={20} color="secondary" />
          </TouchableOpacity>
          <View style={styles.topBarTitleWrap}>
            <Text style={styles.topBarTitle}>Servicos</Text>
            <Text style={styles.topBarSub}>{items.length} servico(s)</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Novo servico</Text>
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(t) => { setName(t); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder="Ex: Alongamento"
                  placeholderTextColor={colors.disabled}
                  returnKeyType="next"
                />
                {errors.name && <Text style={styles.errorItem}>{errors.name}</Text>}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Descricao</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Opcional"
                  placeholderTextColor={colors.disabled}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Duracao (min) *</Text>
                  <TextInput
                    style={[styles.input, errors.duration && styles.inputError]}
                    value={duration}
                    onChangeText={(t) => { setDuration(t.replace(/[^0-9]/g, '')); if (errors.duration) setErrors((p) => ({ ...p, duration: undefined })); }}
                    placeholder="60"
                    placeholderTextColor={colors.disabled}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                  {errors.duration && <Text style={styles.errorItem}>{errors.duration}</Text>}
                </View>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Preco (R$)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={(t) => setPrice(t.replace(/[^0-9.,]/g, ''))}
                    placeholder="Opcional"
                    placeholderTextColor={colors.disabled}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.createBtn, creating && styles.disabled]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.7}
              >
                <Text style={styles.createBtnText}>{creating ? 'Criando...' : 'Criar servico'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicos cadastrados</Text>
            {items.length === 0 ? (
              <EmptyState title="Nenhum servico" description="Crie o primeiro servico acima." icon="sparkles" />
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{item.service.name}</Text>
                    <Text style={styles.cardMeta}>{item.duration_minutes}min {item.price != null ? `\u2022 R$ ${item.price.toFixed(2)}` : ''}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRequest(item.id, item.service.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon name="delete" size={18} color="error" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <ConfirmationDialog
        visible={confirmVisible}
        title="Excluir servico"
        message={`Deseja excluir "${pendingDeleteLabel}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmVisible(false); setPendingDeleteId(null); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  topBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.screenPadding, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: spacing.sm },
  topBarTitleWrap: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  topBarSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.screenPadding },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  form: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  field: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 4 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    ...typography.input,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.error },
  errorItem: { fontSize: 11, color: colors.error, marginTop: 4 },
  createBtn: {
    height: 48,
    backgroundColor: colors.gold,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { ...typography.button, color: '#FFFFFF' },
  disabled: { opacity: 0.6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardBody: { flex: 1 },
  cardName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
  errorText: { ...typography.bodySmall, color: colors.error },
});
