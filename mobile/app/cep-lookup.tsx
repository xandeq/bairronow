import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { cepApi } from '../src/lib/api';
import { useOnboardingStore } from '../src/lib/onboarding-store';
import type { CepLookupResult } from '@bairronow/shared-types';

export default function CepLookup() {
  const router = useRouter();
  const setAddress = useOnboardingStore((s) => s.setAddress);
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setLocalAddress] = useState<CepLookupResult | null>(null);

  const lookup = async () => {
    setLoading(true);
    try {
      const a = await cepApi.lookup(cep);
      setLocalAddress(a);
      setAddress(a);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? e?.message ?? 'CEP não encontrado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seu endereço</Text>
      <Text style={styles.subtitle}>Para conectar você ao seu bairro</Text>
      <View style={{ height: 24 }} />
      <Input
        label="CEP"
        value={cep}
        onChangeText={setCep}
        placeholder="00000-000"
        keyboardType="numeric"
      />
      <Button title="Buscar" onPress={lookup} loading={loading} />
      {address && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{address.logradouro}</Text>
          <Text style={styles.cardLine}>
            {address.bairro} • {address.localidade}/{address.uf}
          </Text>
          {address.bairroId == null && (
            <Text style={styles.warning}>Ainda não atendemos este bairro.</Text>
          )}
          <View style={{ height: 16 }} />
          <Button
            title="Confirmar e continuar"
            onPress={() => router.push('/proof-upload')}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { marginTop: 24, padding: 20, backgroundColor: '#F3F4F6', borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardLine: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  warning: { marginTop: 12, fontSize: 13, color: '#B45309', fontWeight: '600' },
});
