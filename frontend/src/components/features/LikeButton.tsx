"use client";

import { useState } from "react";
import { feedClient } from "@/lib/feed";
import { useFeedStore } from "@/stores/feed-store";

interface LikeButtonProps {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  onChange?: (liked: boolean, count: number) => void;
}

// Optimistic toggle: setLiked immediately, reconcile with server response.
export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  onChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const setStoreLiked = useFeedStore((s) => s.setLiked);

  const handleClick = async () => {
    if (busy) return;
    const prevLiked = liked;
    const prevCount = count;
    const optimisticLiked = !prevLiked;
    const optimisticCount = prevCount + (optimisticLiked ? 1 : -1);

    // optimistic
    setLiked(optimisticLiked);
    setCount(optimisticCount);
    setStoreLiked(postId, optimisticLiked, optimisticCount);
    onChange?.(optimisticLiked, optimisticCount);

    setBusy(true);
    try {
      const res = await feedClient.toggleLike(postId);
      setLiked(res.liked);
      setCount(res.count);
      setStoreLiked(postId, res.liked, res.count);
      onChange?.(res.liked, res.count);
    } catch {
      // revert
      setLiked(prevLiked);
      setCount(prevCount);
      setStoreLiked(postId, prevLiked, prevCount);
      onChange?.(prevLiked, prevCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Descurtir" : "Curtir"}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
        liked ? "text-red-600" : "text-fg/70 hover:text-red-600"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
