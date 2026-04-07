import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { ProofPicker, type PickedFile } from '../src/components/ProofPicker';
import { verificationApi } from '../src/lib/api';
import { useOnboardingStore } from '../src/lib/onboarding-store';

export default function ProofUpload() {
  const router = useRouter();
  const address = useOnboardingStore((s) => s.address);
  const setStatus = useOnboardingStore((s) => s.setStatus);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [numero, setNumero] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!address) {
      Alert.alert('Endereço ausente', 'Informe o CEP novamente.');
      router.replace('/cep-lookup');
      return;
    }
    if (!file) {
      Alert.alert('Selecione um documento');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('cep', (address.cep ?? '').replace(/\D/g, ''));
      if (numero) fd.append('numero', numero);
      // React Native FormData file pattern
      fd.append('proof', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      const status = await verificationApi.submit(fd);
      setStatus(status);
      router.replace('/pending');
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? e?.message ?? 'Falha ao enviar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Comprovante de residência</Text>
      <Text style={styles.subtitle}>Conta de luz, água, internet ou similar</Text>
      <View style={{ height: 24 }} />
      <Input
        label="Número (opcional)"
        value={numero}
        onChangeText={setNumero}
        placeholder="Ex.: 123, apto 45"
      />
      <ProofPicker onFile={setFile} />
      {file && (
        <View style={styles.fileCard}>
          <Text style={styles.fileName}>{file.name}</Text>
          <Text style={styles.fileMeta}>
            {(file.size / 1024).toFixed(0)} KB • {file.type}
          </Text>
        </View>
      )}
      <View style={{ height: 16 }} />
      <Button title="Enviar" onPress={submit} disabled={!file} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  fileCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  fileName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  fileMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
