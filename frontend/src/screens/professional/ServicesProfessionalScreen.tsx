import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyProfessionalId, useProfessionalServices, useCreateServiceForProfessional, useUpdateProfessionalService, useUpdateServiceCatalog, useDeleteProfessionalService } from '@hooks';
import { colors, spacing, radius, elevation, typography } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import Button from '@components/base/Button';
import SecondaryButton from '@components/base/SecondaryButton';
import LoadingState from '@components/base/LoadingState';
import EmptyState from '@components/base/EmptyState';
import ConfirmationDialog from '@components/base/ConfirmationDialog';

interface FormData {
  name: string;
  description: string;
  duration: string;
  price: string;
}

const emptyForm: FormData = { name: '', description: '', duration: '', price: '' };

export default function ServicesProfessionalScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { professionalId, loading: pidLoading } = useMyProfessionalId();
  const { items, loading: servicesLoading, refetch } = useProfessionalServices(professionalId);
  const { create, loading: creating } = useCreateServiceForProfessional();
  const { update, loading: updating } = useUpdateProfessionalService();
  const { updateCatalog } = useUpdateServiceCatalog();
  const { remove, loading: deleting } = useDeleteProfessionalService();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<{ name?: string; duration?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState('');

  const loading = pidLoading || servicesLoading;

  if (loading) return <LoadingState message="Carregando servicos..." />;

  if (!professionalId) {
    return (
      <View style={styles.center}>
        <AppIcon name="warning" size={32} color="error" />
        <Text style={styles.errorTitle}>Profissional nao encontrado</Text>
        <Text style={styles.errorText}>Nao foi possivel identificar o profissional logado.</Text>
      </View>
    );
  }

  const validate = (): boolean => {
    const newErrors: { name?: string; duration?: string } = {};
    if (!form.name.trim()) newErrors.name = 'Nome obrigatorio';
    const dur = parseInt(form.duration, 10);
    if (!form.duration || isNaN(dur) || dur <= 0) newErrors.duration = 'Duracao invalida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
    setEditingServiceId(null);
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await create(
        professionalId,
        form.name.trim(),
        form.description.trim() || null,
        parseInt(form.duration, 10),
        form.price ? parseFloat(form.price.replace(',', '.')) : null
      );
      resetForm();
      refetch();
    } catch (err: any) {
      Alert.alert('Erro ao criar servico', err?.message || 'Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditingServiceId(item.service_id || null);
    setForm({
      name: item.service?.name || '',
      description: item.service?.description || '',
      duration: String(item.duration_minutes || ''),
      price: item.price != null ? String(item.price) : '',
    });
    setErrors({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const dur = parseInt(form.duration, 10);
    if (!form.duration || isNaN(dur) || dur <= 0) {
      setErrors({ duration: 'Duracao invalida' });
      return;
    }
    if (!form.name.trim()) {
      setErrors({ name: 'Nome obrigatorio' });
      return;
    }
    try {
      await update(editingId, {
        duration_minutes: dur,
        price: form.price ? parseFloat(form.price.replace(',', '.')) : null,
      });

      if (editingServiceId) {
        await updateCatalog(editingServiceId, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          default_duration_minutes: dur,
        });
      }

      resetForm();
      refetch();
    } catch (err: any) {
      Alert.alert('Erro ao atualizar servico', err?.message || 'Verifique os dados e tente novamente.');
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
      if (editingId === pendingDeleteId) resetForm();
      refetch();
    } catch (err: any) {
      Alert.alert('Erro ao excluir servico', err?.message || 'Nao foi possivel excluir este servico.');
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
            <Text style={styles.topBarSub}>{items.length} servico(s) cadastrado(s)</Text>
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
            <Text style={styles.sectionTitle}>{editingId ? 'Editar servico' : 'Novo servico'}</Text>
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={form.name}
                  onChangeText={(t) => { setForm((p) => ({ ...p, name: t })); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
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
                  value={form.description}
                  onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
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
                    value={form.duration}
                    onChangeText={(t) => { setForm((p) => ({ ...p, duration: t.replace(/[^0-9]/g, '') })); if (errors.duration) setErrors((p) => ({ ...p, duration: undefined })); }}
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
                    value={form.price}
                    onChangeText={(t) => setForm((p) => ({ ...p, price: t.replace(/[^0-9.,]/g, '') }))}
                    placeholder="Opcional"
                    placeholderTextColor={colors.disabled}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
              <View style={styles.formActions}>
                {editingId && (
                  <SecondaryButton title="Cancelar" onPress={resetForm} style={{ flex: 1 }} />
                )}
                <Button
                  title={creating ? 'Criando...' : updating ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Criar servico'}
                  onPress={editingId ? handleUpdate : handleCreate}
                  disabled={creating || updating}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicos cadastrados</Text>
            {items.length === 0 ? (
              <EmptyState title="Nenhum servico" description="Crie o primeiro servico acima." icon="sparkles" />
            ) : (
              items.map((item) => {
                const isEditing = editingId === item.id;
                const hasDescription = !!item.service?.description;
                return (
                  <View key={item.id} style={[styles.card, isEditing && styles.cardEditing]}>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{item.service?.name || 'Sem nome'}</Text>
                      {hasDescription && (
                        <Text style={styles.cardDescription} numberOfLines={2}>{item.service?.description}</Text>
                      )}
                      <Text style={styles.cardMeta}>
                        {item.duration_minutes} min {item.price != null ? `\u2022 R$ ${item.price.toFixed(2)}` : ''}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <AppIcon name="edit" size={18} color="gold" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRequest(item.id, item.service?.name || 'servico')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <AppIcon name="delete" size={18} color="error" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>

      <ConfirmationDialog
        visible={confirmVisible}
        title="Excluir servico"
        message={`Deseja excluir "${pendingDeleteLabel}"? Esta acao nao pode ser desfeita.`}
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
  errorTitle: { ...typography.body, fontWeight: '600', color: colors.error, marginTop: spacing.md },
  errorText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
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
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
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
  cardEditing: { borderColor: colors.gold, borderWidth: 1.5 },
  cardBody: { flex: 1 },
  cardName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  cardDescription: { fontSize: 13, fontWeight: '400', color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  cardMeta: { fontSize: 13, fontWeight: '500', color: colors.gold, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { padding: spacing.sm },
  deleteBtn: { padding: spacing.sm },
});
