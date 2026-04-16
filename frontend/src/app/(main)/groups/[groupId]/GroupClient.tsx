'use client';
import { useEffect, useState } from 'react';
import { getHubConnection } from '@/lib/signalr';
import { useGroupStore } from '@/stores/group-store';
import { getGroup, getGroupPosts, createGroupPost, getGroupEvents, rsvpEvent } from '@/lib/api/groups';
import type { GroupPost, GroupEvent } from '@/lib/types/groups';

interface Props {
  groupId: number;
}

export default function GroupClient({ groupId }: Props) {
  const {
    posts,
    appendPosts,
    prependPost,
    resetFeed,
    incrementPage,
    page,
    hasMore,
    currentGroup,
    setCurrentGroup,
  } = useGroupStore();
  const [composerBody, setComposerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'events'>('feed');

  // Load group detail and initial posts
  useEffect(() => {
    resetFeed();
    Promise.all([getGroup(groupId), getGroupPosts(groupId, 1)]).then(([g, p]) => {
      setCurrentGroup(g);
      appendPosts(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Infinite scroll — load more pages
  useEffect(() => {
    if (page === 1) return;
    getGroupPosts(groupId, page).then(appendPosts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // SignalR — join group room, listen for new posts
  useEffect(() => {
    let cleanup = false;
    getHubConnection().then((hub) => {
      if (cleanup) return;
      hub.invoke('JoinGroup', groupId).catch(console.error);
      hub.on('NewGroupPost', (post: GroupPost) => prependPost(post));
      hub.on('GroupEventReminder', (ev: { id: number; title: string; startsAt: string }) => {
        console.info('GroupEventReminder', ev);
      });

      // Reconnect: re-join after hub reconnects (Pitfall 6)
      const onReconnected = () => hub.invoke('JoinGroup', groupId).catch(console.error);
      hub.onreconnected(onReconnected);
    });

    return () => {
      cleanup = true;
      getHubConnection().then((hub) => {
        hub.invoke('LeaveGroup', groupId).catch(console.error);
        hub.off('NewGroupPost');
        hub.off('GroupEventReminder');
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerBody.trim()) return;
    setSubmitting(true);
    try {
      await createGroupPost(groupId, { body: composerBody, category: 'Outros' });
      setComposerBody('');
      // SignalR will push the new post back — no manual prepend needed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {currentGroup && (
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-fg">{currentGroup.name}</h1>
          <p className="text-sm text-muted-fg mt-1">{currentGroup.description}</p>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-4 border-b border-border mb-4">
        {(['feed', 'events'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium ${
              activeTab === tab ? 'border-b-2 border-green-700 text-green-700' : 'text-muted-fg'
            }`}
          >
            {tab === 'feed' ? 'Feed' : 'Eventos'}
          </button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <>
          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-xl border border-border shadow-sm p-4 mb-4"
          >
            <textarea
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
              placeholder="Compartilhe algo com o grupo..."
              rows={3}
              className="w-full resize-none text-sm text-muted-fg outline-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !composerBody.trim()}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded-lg"
              >
                {submitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>

          {/* Posts */}
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-fg text-xs">
                    {p.author.displayName?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">{p.author.displayName}</p>
                    <p className="text-xs text-muted-fg">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-fg">{p.body}</p>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => incrementPage()}
              className="mt-4 w-full text-sm text-green-700 py-2 border border-green-200 rounded-lg hover:bg-green-50"
            >
              Carregar mais
            </button>
          )}
        </>
      )}

      {activeTab === 'events' && <GroupEventsTab groupId={groupId} />}
    </div>
  );
}

// Inline events tab (GRP-007)
function GroupEventsTab({ groupId }: { groupId: number }) {
  const [events, setEvents] = useState<GroupEvent[]>([]);

  useEffect(() => {
    getGroupEvents(groupId).then(setEvents);
  }, [groupId]);

  const handleRsvp = (ev: GroupEvent) => {
    rsvpEvent(groupId, ev.id, !ev.myRsvp)
      .then(() =>
        setEvents((evs) =>
          evs.map((e) =>
            e.id === ev.id
              ? { ...e, myRsvp: !e.myRsvp, rsvpCount: e.rsvpCount + (!e.myRsvp ? 1 : -1) }
              : e
          )
        )
      )
      .catch(console.error);
  };

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
          <p className="font-medium text-fg">{ev.title}</p>
          {ev.location && <p className="text-sm text-muted-fg">{ev.location}</p>}
          <p className="text-sm text-muted-fg">{new Date(ev.startsAt).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-fg">{ev.rsvpCount} confirmados</p>
          <button
            onClick={() => handleRsvp(ev)}
            className={`mt-2 text-sm px-3 py-1 rounded-lg ${
              ev.myRsvp ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-fg'
            }`}
          >
            {ev.myRsvp ? 'Confirmado' : 'Confirmar presença'}
          </button>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-sm text-muted-fg text-center py-8">Nenhum evento criado ainda.</p>
      )}
    </div>
  );
}
