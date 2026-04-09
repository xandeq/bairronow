import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../src/components/Button';
import { marketplaceApi } from '../../../src/lib/api/marketplace';
import type { ListingDto } from '../../../src/lib/api/marketplace.types';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Number(id);
  const router = useRouter();

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    marketplaceApi.get(listingId).then((l) => {
      setListing(l);
      setTitle(l.title);
      setDescription(l.description);
      setPrice(String(l.price));
    });
  }, [listingId]);

  if (!listing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await marketplaceApi.update(listingId, {
        title,
        description,
        price: Number(price),
      });
      Alert.alert('Salvo', 'Anúncio atualizado.');
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Título</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
      />
      <Text style={styles.label}>Preço (R$)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
      />
      <View style={{ height: 16 }} />
      <Button title="Salvar alterações" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
});
