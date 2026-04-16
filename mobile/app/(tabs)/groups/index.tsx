import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { useGroupStore } from '@/features/groups/useGroupStore';
import { getGroups, joinGroup } from '@/features/groups/groupsApi';
import type { Group } from '@/features/groups/groupsApi';

export default function GroupsIndex() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { groups, setGroups } = useGroupStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!user?.bairroId) return;
    setLoading(true);
    getGroups(user.bairroId, { search: search || undefined })
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [user?.bairroId, search]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (group: Group) => {
    setJoiningId(group.id);
    try {
      await joinGroup(group.id);
      router.push(`/groups/${group.id}`);
    } finally {
      setJoiningId(null);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/groups/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.categoryBadge}>{item.category}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.memberCount}>{item.memberCount} membros</Text>
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => handleJoin(item)}
          disabled={joiningId === item.id}
        >
          <Text style={styles.joinBtnText}>
            {joiningId === item.id ? '...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grupos do Bairro</Text>
        <TouchableOpacity onPress={() => router.push('/groups/new')} style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ Criar</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Buscar grupos..."
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {loading ? (
        <ActivityIndicator color="#15803D" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => String(g.id)}
          renderItem={renderGroup}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum grupo encontrado.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', color: '#111827' },
  createBtn: { backgroundColor: '#15803D', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  search: { marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  categoryBadge: { fontSize: 11, color: '#374151', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  description: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberCount: { fontSize: 12, color: '#9CA3AF' },
  joinBtn: { backgroundColor: '#15803D', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 5 },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
