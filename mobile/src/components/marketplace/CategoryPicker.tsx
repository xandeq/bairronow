import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import type { CategoryDto } from '../../lib/api/marketplace.types';

interface Props {
  visible: boolean;
  categories: CategoryDto[];
  onSelect: (categoryCode: string, subcategoryCode: string) => void;
  onClose: () => void;
}

/**
 * D-03: Two-step chip grid (category → subcategory), not dropdowns.
 */
export function CategoryPicker({ visible, categories, onSelect, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);

  const handleClose = () => {
    setSelectedCategory(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedCategory ? selectedCategory.displayName : 'Escolha a categoria'}
          </Text>
          <Pressable onPress={handleClose}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {!selectedCategory
            ? categories
                .filter((c) => c.enabled)
                .map((cat) => (
                  <Pressable
                    key={cat.code}
                    style={styles.chip}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={styles.chipText}>{cat.displayName}</Text>
                  </Pressable>
                ))
            : selectedCategory.subcategories.map((sub) => (
                <Pressable
                  key={sub.code}
                  style={styles.chip}
                  onPress={() => {
                    onSelect(selectedCategory.code, sub.code);
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={styles.chipText}>{sub.displayName}</Text>
                </Pressable>
              ))}
        </ScrollView>
        {selectedCategory && (
          <Pressable style={styles.backBtn} onPress={() => setSelectedCategory(null)}>
            <Text style={styles.backText}>← Voltar para categorias</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  close: { fontSize: 22, color: '#6B7280', fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
  },
  chipText: { color: '#111827', fontWeight: '600', fontSize: 14 },
  backBtn: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backText: { color: '#16A34A', fontWeight: '700' },
});
