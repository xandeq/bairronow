import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from '../Button';
import type { ListingPhotoAsset } from '../../lib/api/marketplace.types';

interface Props {
  photos: ListingPhotoAsset[];
  onChange: (photos: ListingPhotoAsset[]) => void;
  max?: number;
}

/**
 * PhotoPicker — replicates the Phase 02-03 ProofPicker pipeline for marketplace listings.
 * D-01: min 1, max 6 photos; first photo is marked "Capa" automatically.
 */
export function PhotoPicker({ photos, onChange, max = 6 }: Props) {
  const [busy, setBusy] = useState(false);
  const remaining = max - photos.length;

  const pickImages = async () => {
    if (remaining <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Conceda acesso às suas fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled) return;
    setBusy(true);
    try {
      const processed: ListingPhotoAsset[] = [];
      for (const asset of result.assets) {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1920 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        processed.push({
          uri: manipulated.uri,
          name: `listing-${Date.now()}-${processed.length}.jpg`,
          type: 'image/jpeg',
        });
      }
      onChange([...photos, ...processed].slice(0, max));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (idx: number) => {
    const next = photos.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = photos.slice();
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  return (
    <View>
      <Text style={styles.label}>Fotos ({photos.length}/{max})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {photos.map((p, idx) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            {idx === 0 && (
              <View style={styles.capaBadge}>
                <Text style={styles.capaText}>Capa</Text>
              </View>
            )}
            <View style={styles.thumbActions}>
              {idx > 0 && (
                <Pressable onPress={() => moveUp(idx)} style={styles.iconBtn}>
                  <Text style={styles.iconText}>↑</Text>
                </Pressable>
              )}
              <Pressable onPress={() => removeAt(idx)} style={[styles.iconBtn, styles.removeBtn]}>
                <Text style={styles.iconText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <Button
        title={busy ? 'Processando…' : `Adicionar fotos (${remaining} restantes)`}
        variant="outline"
        onPress={pickImages}
        disabled={busy || remaining <= 0}
      />
      <Text style={styles.hint}>Mínimo 1, máximo {max}. A primeira foto é a capa.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  row: { marginBottom: 12 },
  thumbWrap: {
    width: 96,
    height: 96,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  capaBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  capaText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  thumbActions: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,24,39,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeBtn: { backgroundColor: 'rgba(220,38,38,0.9)' },
  iconText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
});
