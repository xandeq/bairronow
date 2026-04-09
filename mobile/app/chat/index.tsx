import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../src/lib/chat-store';
import { VerifiedBadge } from '../../src/components/VerifiedBadge';

export default function ConversationListScreen() {
  const router = useRouter();
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const connect = useChatStore((s) => s.connect);
  const loadUnread = useChatStore((s) => s.loadUnreadCount);

  useEffect(() => {
    loadConversations();
    loadUnread();
    connect();
  }, []);

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return (
    <FlatList
      style={styles.container}
      data={sorted}
      keyExtractor={(c) => String(c.id)}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={loadConversations} />
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
        >
          {item.listingThumbnailUrl ? (
            <Image source={{ uri: item.listingThumbnailUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.otherUserDisplayName || 'Vizinho'}
              </Text>
              <VerifiedBadge verified={item.otherUserIsVerified} />
            </View>
            <Text style={styles.listing} numberOfLines={1}>
              {item.listingTitle}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ color: '#6B7280' }}>Nenhuma conversa ainda.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  thumb: { width: 52, height: 52, borderRadius: 8, marginRight: 12, backgroundColor: '#F3F4F6' },
  thumbPlaceholder: { backgroundColor: '#E5E7EB' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginRight: 6, flexShrink: 1 },
  listing: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  empty: { padding: 32, alignItems: 'center' },
});
