import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../src/components/Button';
import { PhotoPicker } from '../../src/components/marketplace/PhotoPicker';
import { CategoryPicker } from '../../src/components/marketplace/CategoryPicker';
import { marketplaceApi } from '../../src/lib/api/marketplace';
import { createListingSchema, type CreateListingInput } from '../../src/lib/validators/listing';
import { useAuthStore } from '../../src/lib/auth-store';
import type { CategoryDto, ListingPhotoAsset } from '../../src/lib/api/marketplace.types';

export default function CreateListingScreen() {
  const router = useRouter();
  const isVerified = useAuthStore((s) => !!s.user?.isVerified);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photos, setPhotos] = useState<ListingPhotoAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryCode: '',
      subcategoryCode: '',
      photos: [],
    },
  });

  useEffect(() => {
    setValue('photos', photos, { shouldValidate: true });
  }, [photos]);

  useEffect(() => {
    marketplaceApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  const onSubmit = async (data: CreateListingInput) => {
    setSubmitting(true);
    try {
      const created = await marketplaceApi.create(
        {
          title: data.title,
          description: data.description,
          price: data.price,
          categoryCode: data.categoryCode,
          subcategoryCode: data.subcategoryCode,
        },
        data.photos
      );
      Alert.alert('Publicado', 'Seu anúncio está no ar!');
      router.replace({ pathname: '/marketplace/[id]', params: { id: created.id } });
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Não foi possível publicar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.warnTitle}>Verificação necessária</Text>
        <Text style={styles.warnText}>
          Você precisa estar verificado para criar anúncios no marketplace.
        </Text>
      </View>
    );
  }

  const categoryCode = watch('categoryCode');
  const subcategoryCode = watch('subcategoryCode');
  const selectedCat = categories.find((c) => c.code === categoryCode);
  const selectedSub = selectedCat?.subcategories.find((s) => s.code === subcategoryCode);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.label}>Título</Text>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextInput
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            placeholder="Ex: Sofá 3 lugares cinza"
          />
        )}
      />
      {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

      <Text style={styles.label}>Descrição</Text>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextInput
            style={[styles.input, styles.textarea]}
            value={field.value}
            onChangeText={field.onChange}
            placeholder="Detalhes, estado, medidas…"
            multiline
            maxLength={500}
          />
        )}
      />
      {errors.description && <Text style={styles.error}>{errors.description.message}</Text>}

      <Text style={styles.label}>Preço (R$)</Text>
      <Controller
        control={control}
        name="price"
        render={({ field }) => (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={field.value ? String(field.value) : ''}
            onChangeText={(t) => field.onChange(Number(t.replace(/[^0-9.]/g, '')))}
            placeholder="Ex: 450"
          />
        )}
      />
      {errors.price && <Text style={styles.error}>{errors.price.message}</Text>}

      <Text style={styles.label}>Categoria</Text>
      <Pressable style={styles.input} onPress={() => setPickerOpen(true)}>
        <Text style={{ color: selectedCat ? '#111827' : '#9CA3AF' }}>
          {selectedCat && selectedSub
            ? `${selectedCat.displayName} → ${selectedSub.displayName}`
            : 'Escolher categoria'}
        </Text>
      </Pressable>
      {errors.categoryCode && <Text style={styles.error}>{errors.categoryCode.message}</Text>}

      <View style={{ height: 16 }} />
      <PhotoPicker photos={photos} onChange={setPhotos} />
      {errors.photos && (
        <Text style={styles.error}>{(errors.photos as any).message || 'Fotos inválidas'}</Text>
      )}

      <View style={{ height: 20 }} />
      <Button
        title={submitting ? 'Publicando…' : 'Publicar anúncio'}
        onPress={handleSubmit(onSubmit)}
        loading={submitting}
      />

      <CategoryPicker
        visible={pickerOpen}
        categories={categories}
        onSelect={(cat, sub) => {
          setValue('categoryCode', cat, { shouldValidate: true });
          setValue('subcategoryCode', sub, { shouldValidate: true });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  error: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  warnTitle: { fontSize: 18, fontWeight: '800', color: '#111827', margin: 16 },
  warnText: { color: '#6B7280', marginHorizontal: 16 },
});
