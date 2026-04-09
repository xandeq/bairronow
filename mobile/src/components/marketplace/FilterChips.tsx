import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useMarketplaceStore } from '../../lib/marketplace-store';

interface Props {
  categories: { code: string; displayName: string }[];
}

export function FilterChips({ categories }: Props) {
  const filters = useMarketplaceStore((s) => s.filters);
  const setFilters = useMarketplaceStore((s) => s.setFilters);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      <Chip
        label="Verificado"
        active={filters.verifiedOnly}
        onPress={() => setFilters({ verifiedOnly: !filters.verifiedOnly })}
      />
      <Chip
        label="Todas categorias"
        active={!filters.category}
        onPress={() => setFilters({ category: undefined })}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.code}
          label={cat.displayName}
          active={filters.category === cat.code}
          onPress={() =>
            setFilters({ category: filters.category === cat.code ? undefined : cat.code })
          }
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={active ? styles.chipTextActive : styles.chipTextInactive}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { maxHeight: 48 },
  content: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  chipInactive: { backgroundColor: '#fff', borderColor: '#D1D5DB' },
  chipTextActive: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipTextInactive: { color: '#374151', fontWeight: '600', fontSize: 13 },
});
