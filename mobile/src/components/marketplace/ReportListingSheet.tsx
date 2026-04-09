import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Alert } from 'react-native';
import { Button } from '../Button';
import { marketplaceApi } from '../../lib/api/marketplace';
import { ReportListingReason, REPORT_REASON_LABELS } from '../../lib/api/marketplace.types';

interface Props {
  visible: boolean;
  listingId: number;
  onClose: () => void;
}

/**
 * D-20: Fixed list of 4 report reasons + optional details.
 */
export function ReportListingSheet({ visible, listingId, onClose }: Props) {
  const [reason, setReason] = useState<ReportListingReason | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reason == null) {
      Alert.alert('Selecione um motivo', 'Escolha uma das opções abaixo.');
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceApi.report(listingId, reason, note || undefined);
      Alert.alert('Obrigado', 'Sua denúncia foi enviada para moderação.');
      setReason(null);
      setNote('');
      onClose();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar a denúncia.');
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = Object.values(ReportListingReason).filter(
    (v) => typeof v === 'number'
  ) as ReportListingReason[];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Denunciar anúncio</Text>
        {reasons.map((r) => (
          <Pressable
            key={r}
            style={[styles.option, reason === r && styles.optionActive]}
            onPress={() => setReason(r)}
          >
            <Text style={[styles.optionText, reason === r && styles.optionTextActive]}>
              {REPORT_REASON_LABELS[r]}
            </Text>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Detalhes (opcional)"
          multiline
          value={note}
          onChangeText={setNote}
        />
        <Button title="Enviar denúncia" onPress={handleSubmit} loading={submitting} />
        <View style={{ height: 8 }} />
        <Button title="Cancelar" variant="outline" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  optionActive: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  optionText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: '#16A34A' },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
    textAlignVertical: 'top',
    color: '#111827',
  },
});
