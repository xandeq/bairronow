import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getHubConnection } from '@/lib/signalr';
import { useGroupStore } from '@/features/groups/useGroupStore';
import {
  getGroup, getGroupPosts, createGroupPost, getGroupEvents, rsvpEvent,
} from '@/features/groups/groupsApi';
import type { GroupPost, GroupEvent } from '@/features/groups/groupsApi';

export default function GroupDetailScreen() {
  const { groupId: gidStr } = useLocalSearchParams<{ groupId: string }>();
  const groupId = parseInt(gidStr ?? '0', 10);
  const { posts, appendPosts, prependPost, resetFeed, currentGroup, setCurrentGroup } = useGroupStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'events'>('feed');
  const [composerText, setComposerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Load group + initial posts
  useEffect(() => {
    if (!groupId) return;
    resetFeed();
    setLoading(true);
    Promise.all([getGroup(groupId), getGroupPosts(groupId, 1)])
      .then(([g, p]) => { setCurrentGroup(g); appendPosts(p); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Load events when switching to events tab
  useEffect(() => {
    if (activeTab === 'events' && !eventsLoaded) {
      getGroupEvents(groupId).then((evs) => { setEvents(evs); setEventsLoaded(true); });
    }
  }, [activeTab, eventsLoaded, groupId]);

  // SignalR: join group room, handle real-time posts
  useEffect(() => {
    if (!groupId) return;

    let cleanup = false;
    // getHubConnection() may return a Promise<HubConnection> or a HubConnection directly (depending on mock/impl)
    // We normalise via Promise.resolve so this works in both test and production environments
    const hubPromise = Promise.resolve(getHubConnection());

    hubPromise.then((hub) => {
      if (cleanup) return;

      const joinGroup = () => hub.invoke('JoinGroup', groupId).catch(console.error);
      joinGroup();

      hub.on('NewGroupPost', (post: GroupPost) => { if (!cleanup) prependPost(post); });

      // Pitfall 6: re-join after reconnect to prevent silent disconnection
      hub.onreconnected(() => { if (!cleanup) joinGroup(); });
    });

    return () => {
      cleanup = true;
      Promise.resolve(getHubConnection()).then((hub) => {
        hub.invoke('LeaveGroup', groupId).catch(console.error);
        hub.off('NewGroupPost');
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handlePost = async () => {
    if (!composerText.trim()) return;
    setSubmitting(true);
    try {
      await createGroupPost(groupId, { body: composerText, category: 'Outros' });
      setComposerText('');
      // SignalR will push new post via NewGroupPost — no manual prepend needed
    } finally {
      setSubmitting(false);
    }
  };

  const handleRsvp = async (ev: GroupEvent) => {
    const next = !ev.myRsvp;
    setEvents((evs) => evs.map((e) => e.id === ev.id ? { ...e, myRsvp: next, rsvpCount: e.rsvpCount + (next ? 1 : -1) } : e));
    await rsvpEvent(groupId, ev.id, next);
  };

  const renderPost = useCallback(({ item }: { item: GroupPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.author.displayName?.[0] ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.authorName}>{item.author.displayName}</Text>
          {item.author.isVerified && <Text style={styles.verified}>Verificado</Text>}
        </View>
      </View>
      <Text style={styles.postBody}>{item.body}</Text>
      <Text style={styles.postMeta}>{item.likeCount} curtidas · {item.commentCount} comentários</Text>
    </View>
  ), []);

  const renderEvent = useCallback(({ item }: { item: GroupEvent }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      {item.location && <Text style={styles.eventMeta}>{item.location}</Text>}
      <Text style={styles.eventMeta}>{new Date(item.startsAt).toLocaleString('pt-BR')}</Text>
      <Text style={styles.eventMeta}>{item.rsvpCount} confirmados</Text>
      <TouchableOpacity
        style={[styles.rsvpBtn, item.myRsvp && styles.rsvpBtnActive]}
        onPress={() => handleRsvp(item)}
      >
        <Text style={[styles.rsvpText, item.myRsvp && styles.rsvpTextActive]}>
          {item.myRsvp ? 'Confirmado' : 'Confirmar presença'}
        </Text>
      </TouchableOpacity>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [events]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {currentGroup && (
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{currentGroup.name}</Text>
          </View>
        )}

        {/* Tab nav */}
        <View style={styles.tabBar}>
          {(['feed', 'events'] as const).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'feed' ? 'Feed' : 'Eventos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'feed' ? (
          <>
            {loading ? <ActivityIndicator color="#15803D" style={{ marginTop: 40 }} /> : (
              <FlatList
                data={posts}
                keyExtractor={(p) => String(p.id)}
                renderItem={renderPost}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                ListEmptyComponent={<Text style={styles.empty}>Nenhuma publicação ainda.</Text>}
              />
            )}
            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                placeholder="Compartilhe algo..."
                value={composerText}
                onChangeText={setComposerText}
                multiline
              />
              <TouchableOpacity onPress={handlePost} disabled={submitting || !composerText.trim()} style={styles.sendBtn}>
                <Text style={styles.sendBtnText}>{submitting ? '...' : 'Enviar'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(e) => String(e.id)}
            renderItem={renderEvent}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum evento criado.</Text>}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  groupHeader: { padding: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  groupName: { fontSize: 20, fontWeight: '600', color: '#111827' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#15803D' },
  tabText: { fontSize: 14, color: '#6B7280' },
  tabTextActive: { color: '#15803D', fontWeight: '600' },
  postCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  authorName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  verified: { fontSize: 11, color: '#15803D' },
  postBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  postMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', gap: 4 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  eventMeta: { fontSize: 13, color: '#6B7280' },
  rsvpBtn: { marginTop: 8, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D1D5DB', alignSelf: 'flex-start' },
  rsvpBtnActive: { backgroundColor: '#DCFCE7', borderColor: '#15803D' },
  rsvpText: { fontSize: 13, color: '#374151' },
  rsvpTextActive: { color: '#15803D', fontWeight: '600' },
  composer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8, alignItems: 'flex-end' },
  composerInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: '#15803D', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
