// Reusable group post list (extracted for testability)
import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import type { GroupPost } from './groupsApi';

interface Props {
  posts: GroupPost[];
  onEndReached?: () => void;
}

export function GroupFeed({ posts, onEndReached }: Props) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => String(p.id)}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.author}>{item.author.displayName}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma publicação.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  author: { fontWeight: '600', fontSize: 14, color: '#111827', marginBottom: 4 },
  body: { fontSize: 14, color: '#374151' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
