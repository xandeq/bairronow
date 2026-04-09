import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { marketplaceApi } from '../../src/lib/api/marketplace';
import { ListingCard } from '../../src/components/marketplace/ListingCard';
import { useAuthStore } from '../../src/lib/auth-store';
import type { ListingDto } from '../../src/lib/api/marketplace.types';

export default function MarketplaceSearchScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const router = useRouter();
  const bairroId = useAuthStore((s) => s.user?.bairroId ?? 0);
  const [items, setItems] = useState<ListingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bairroId || !q) return;
    setLoading(true);
    marketplaceApi
      .search(bairroId, q)
      .then((page) => setItems(page.items))
      .finally(() => setLoading(false));
  }, [q, bairroId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(l) => String(l.id)}
      numColumns={2}
      contentContainerStyle={{ padding: 6 }}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={() => router.push({ pathname: '/marketplace/[id]', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: '#6B7280' }}>Nenhum resultado para "{q}".</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { padding: 32, alignItems: 'center' },
});
