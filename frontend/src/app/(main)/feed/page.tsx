"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FeedHeader from "@/components/layouts/FeedHeader";
import PostCard from "@/components/features/PostCard";
import PostComposer from "@/components/features/PostComposer";
import EmptyState from "@/components/ui/EmptyState";
import { useFeedStore } from "@/stores/feed-store";
import { useAuthStore } from "@/lib/auth";

function PlusIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border/70 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded-full animate-shimmer" />
          <div className="h-2.5 w-20 rounded-full animate-shimmer" />
        </div>
        <div className="h-5 w-16 rounded-full animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full animate-shimmer" />
        <div className="h-3 w-4/5 rounded-full animate-shimmer" />
        <div className="h-3 w-2/3 rounded-full animate-shimmer" />
      </div>
      <div className="flex gap-3 pt-2 border-t border-border/60">
        <div className="h-7 w-16 rounded-xl animate-shimmer" />
        <div className="h-7 w-16 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const items = useFeedStore((s) => s.items);
  const loading = useFeedStore((s) => s.loading);
  const hasMore = useFeedStore((s) => s.hasMore);
  const error = useFeedStore((s) => s.error);
  const loadFirst = useFeedStore((s) => s.loadFirst);
  const loadMore = useFeedStore((s) => s.loadMore);

  const [composerOpen, setComposerOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const u = useAuthStore.getState().user;
      const bairroId = u?.bairroId ?? null;
      if (!bairroId) {
        router.replace("/cep-lookup/");
        return;
      }
      loadFirst(bairroId);
    }, 0);
    return () => clearTimeout(t);
  }, [router, loadFirst]);

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const u = useAuthStore.getState().user;
      const bairroId = u?.bairroId ?? null;
      if (!bairroId) return;
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        loadMore(bairroId);
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(onIntersect, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onIntersect]);

  const initialLoading = loading && items.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <FeedHeader />

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-danger-light border border-danger/20 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {initialLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum post ainda no seu bairro"
          description="Seja o primeiro a compartilhar uma novidade com a vizinhança."
          action={{ label: "Criar post", onClick: () => setComposerOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {items.map((post, i) => (
            <div
              key={post.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div
            className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent"
            style={{ animation: "spin-smooth 0.7s linear infinite" }}
          />
        </div>
      )}

      <div ref={sentinelRef} aria-hidden className="h-4" />

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-6 z-30 w-14 h-14 bg-primary text-white rounded-2xl shadow-blue flex items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        aria-label="Novo post"
        style={{ boxShadow: "0 4px 20px rgba(37,99,235,0.35), 0 2px 6px rgba(37,99,235,0.15)" }}
      >
        <PlusIcon />
      </button>

      <PostComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}
