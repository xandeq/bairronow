"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PostDto } from "@bairronow/shared-types";
import VerifiedBadge from "@/components/VerifiedBadge";
import LikeButton from "./LikeButton";
import ReportDialog from "./ReportDialog";
import { useAuthStore } from "@/lib/auth";
import { feedClient } from "@/lib/feed";
import { useFeedStore } from "@/stores/feed-store";

interface PostCardProps {
  post: PostDto;
  onLikeChange?: (liked: boolean, count: number) => void;
  onDelete?: (id: number) => void;
  linkToDetail?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Dica: "bg-blue-100 text-blue-800",
  Alerta: "bg-red-100 text-red-800",
  Pergunta: "bg-purple-100 text-purple-800",
  Evento: "bg-yellow-100 text-yellow-800",
  Geral: "bg-muted text-fg",
};

export default function PostCard({
  post,
  onLikeChange,
  onDelete,
  linkToDetail = true,
}: PostCardProps) {
  const user = useAuthStore((s) => s.user);
  const removePost = useFeedStore((s) => s.removePost);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = user?.id === post.author.id;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    locale: ptBR,
    addSuffix: true,
  });

  const handleDelete = async () => {
    if (!confirm("Excluir este post?")) return;
    setBusy(true);
    try {
      await feedClient.deletePost(post.id);
      removePost(post.id);
      onDelete?.(post.id);
    } finally {
      setBusy(false);
    }
  };

  const grid =
    post.images.length === 1
      ? "grid-cols-1"
      : post.images.length === 2
        ? "grid-cols-2"
        : post.images.length === 3
          ? "grid-cols-3"
          : "grid-cols-2";

  return (
    <article className="bg-card rounded-lg shadow p-4">
      <header className="flex items-center gap-3 mb-3">
        {post.author.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author.photoUrl}
            alt={post.author.displayName ?? "Autor"}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
            {(post.author.displayName ?? "?").charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-fg truncate">
              {post.author.displayName ?? "Vizinho"}
            </p>
            <VerifiedBadge verified={post.author.isVerified} size="sm" />
          </div>
          <p className="text-xs text-fg/60 font-medium">
            {timeAgo}
            {post.isEdited ? " · Editado" : ""}
          </p>
        </div>
        <span
          className={`text-xs font-bold rounded-full px-3 py-1 ${
            CATEGORY_COLORS[post.category] ?? "bg-muted text-fg"
          }`}
        >
          {post.category}
        </span>
      </header>

      <p className="text-fg leading-relaxed mb-3 whitespace-pre-wrap">
        {post.body}
      </p>

      {post.images.length > 0 && (
        <div className={`grid ${grid} gap-2 mb-3`}>
          {post.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={`Imagem ${i + 1}`}
              className="w-full h-48 object-cover rounded-md"
            />
          ))}
        </div>
      )}

      <footer className="flex items-center gap-6 text-sm font-semibold text-fg/70 pt-2 border-t border-border">
        <LikeButton
          postId={post.id}
          initialLiked={post.likedByMe}
          initialCount={post.likeCount}
          onChange={onLikeChange}
        />
        {linkToDetail ? (
          <Link
            href={`/feed/post/?id=${post.id}`}
            className="hover:text-green-700"
            aria-label="Ver comentários"
          >
            💬 {post.commentCount}
          </Link>
        ) : (
          <span>💬 {post.commentCount}</span>
        )}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="ml-auto text-fg/50 hover:text-red-600"
        >
          Denunciar
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="text-fg/50 hover:text-red-600"
          >
            Excluir
          </button>
        )}
      </footer>

      <ReportDialog
        targetType="post"
        targetId={post.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </article>
  );
}
