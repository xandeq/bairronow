import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../src/components/Button';

export default function ProofUpload() {
  const router = useRouter();
  const [uri, setUri] = useState<string | null>(null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setUri(result.assets[0].uri);
  };

  const submit = () => {
    if (!uri) return Alert.alert('Selecione um documento');
    // TODO: upload to API
    router.push('/pending');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Comprovante de residência</Text>
      <Text style={styles.subtitle}>Conta de luz, água, internet ou similar</Text>
      <View style={{ height: 24 }} />
      <Button title={uri ? 'Trocar foto' : 'Selecionar foto'} variant="outline" onPress={pick} />
      {uri && <Image source={{ uri }} style={styles.preview} />}
      <View style={{ height: 16 }} />
      <Button title="Enviar" onPress={submit} disabled={!uri} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  preview: { width: '100%', height: 280, borderRadius: 8, marginTop: 16, backgroundColor: '#F3F4F6' },
});
