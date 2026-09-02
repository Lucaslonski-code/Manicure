import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyProfessionalId, useProfessionalServices, useCreateServiceForProfessional, useDeleteProfessionalService } from '@hooks';
import { colors, spacing, radius, elevation } from '@theme';
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.header}>
          <View style={styles.headerAccent} />
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Servicos</Text>
              <Text style={styles.headerSub}>{items.length} servico(s)</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <AppIcon name="chevron-left" size={18} color="secondary" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Novo servico</Text>
          <View style={styles.sectionGap} />
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(t) => { setName(t); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder="Ex: Alongamento"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Descricao</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Opcional"
                placeholderTextColor={colors.textSecondary}
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
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
              </View>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Preco (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/[^0-9.,]/g, ''))}
                  placeholder="Opcional"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </View>
            <TouchableOpacity style={[styles.createBtn, creating && styles.disabled]} onPress={handleCreate} disabled={creating} activeOpacity={0.7}>
              <AppIcon name="sparkles" size={16} color="surface" />
              <Text style={styles.createBtnText}>{creating ? 'Criando...' : 'Criar servico'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicos cadastrados</Text>
          <View style={styles.sectionGap} />
          {items.length === 0 ? (
            <EmptyState title="Nenhum servico" description="Crie o primeiro servico acima." icon="sparkles" />
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.service.name}</Text>
                  <Text style={styles.cardMeta}>{item.duration_minutes}min {item.price != null ? `• R$ ${item.price.toFixed(2)}` : ''}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRequest(item.id, item.service.name)} activeOpacity={0.7}>
                  <AppIcon name="delete" size={16} color="error" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
  header: { paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTextWrap: { flex: 1 },
  headerAccent: { width: 3, height: 24, borderRadius: 2, backgroundColor: colors.gold, marginBottom: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  backBtn: { padding: spacing.sm },
  section: { marginBottom: 20, paddingHorizontal: spacing.screenPadding },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  sectionGap: { height: 10 },
  form: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...elevation.sm },
  field: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 11, color: colors.error, marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: 12,
    gap: 6,
  },
  createBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  disabled: { opacity: 0.6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...elevation.sm,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
});
