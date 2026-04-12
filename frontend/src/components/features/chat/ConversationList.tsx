"use client";

import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { ConversationDto } from "@/lib/types/marketplace";

export interface ConversationListProps {
  conversations: ConversationDto[];
}

export default function ConversationList({
  conversations,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="bg-bg border-2 border-border rounded-lg p-8 text-center">
        <p className="text-fg/60 font-medium">
          Nenhuma conversa ainda. Abra um anúncio e inicie um chat.
        </p>
      </div>
    );
  }

  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
  );

  return (
    <ul className="space-y-2">
      {sorted.map((c) => (
        <li key={c.id}>
          <Link
            href={`/chat/${c.id}/`}
            className="flex items-center gap-3 p-3 bg-bg border-2 border-border rounded-lg hover:bg-muted"
          >
            {c.listingThumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.listingThumbnailUrl}
                alt={c.listingTitle}
                className="w-14 h-14 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-fg truncate">
                  {c.listingTitle}
                </span>
                {c.otherUserIsVerified && <VerifiedBadge verified size="sm" />}
              </div>
              <p className="text-xs text-fg/60 font-medium truncate">
                {c.otherUserDisplayName ?? "Vizinho"}
              </p>
            </div>
            {c.unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-extrabold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1">
                {c.unreadCount > 99 ? "99+" : c.unreadCount}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
