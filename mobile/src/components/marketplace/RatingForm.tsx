import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Button } from '../Button';
import { marketplaceApi } from '../../lib/api/marketplace';

interface Props {
  sellerId: string;
  listingId: number;
  onSubmitted: () => void;
}

export function RatingForm({ sellerId, listingId, onSubmitted }: Props) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars < 1) {
      Alert.alert('Nota obrigatória', 'Selecione de 1 a 5 estrelas.');
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceApi.createRating(sellerId, { stars, comment, listingId });
      Alert.alert('Obrigado', 'Sua avaliação foi registrada.');
      onSubmitted();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar a avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Avalie o vendedor</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} style={styles.star}>
            <Text style={[styles.starText, n <= stars && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Comentário (opcional)"
        multiline
        value={comment}
        onChangeText={setComment}
      />
      <Button title="Enviar avaliação" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 10, marginVertical: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  star: { paddingHorizontal: 4 },
  starText: { fontSize: 36, color: '#D1D5DB' },
  starActive: { color: '#F59E0B' },
  input: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
    color: '#111827',
  },
});
