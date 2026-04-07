"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HubConnection } from "@microsoft/signalr";
import type { NotificationDto } from "@bairronow/shared-types";
import { createNotificationHub } from "@/lib/signalr";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuthStore } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function notificationLabel(n: NotificationDto): string {
  const who = n.actor.displayName ?? "Alguém";
  switch (n.type) {
    case "comment":
      return `${who} comentou no seu post`;
    case "reply":
      return `${who} respondeu seu comentário`;
    case "like":
      return `${who} curtiu seu post`;
    case "mention":
      return `${who} mencionou você`;
    default:
      return `${who} interagiu com você`;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const load = useNotificationStore((s) => s.load);
  const prepend = useNotificationStore((s) => s.prepend);
  const markRead = useNotificationStore((s) => s.markRead);

  useEffect(() => {
    let hub: HubConnection | null = null;
    let mounted = true;

    load();

    hub = createNotificationHub({
      baseUrl: API_BASE,
      getAccessToken: () => useAuthStore.getState().accessToken,
    });

    hub.on("notification", (dto: NotificationDto) => {
      if (mounted) prepend(dto);
    });

    hub.start().catch(() => {
      // best-effort: hub down doesn't break the page
    });

    return () => {
      mounted = false;
      hub?.stop().catch(() => undefined);
    };
  }, [load, prepend]);

  const last10 = items.slice(0, 10);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative p-2 rounded-md hover:bg-gray-100"
      >
        <span aria-hidden className="text-xl">
          🔔
        </span>
        {unread > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
          <div className="p-3 border-b font-bold text-fg">Notificações</div>
          {last10.length === 0 ? (
            <p className="p-4 text-sm text-fg/60">Nenhuma notificação.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {last10.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.postId ? `/feed/post/?id=${n.postId}` : "/feed/"}
                    onClick={() => {
                      void markRead(n.id);
                      setOpen(false);
                    }}
                    className={`block p-3 text-sm border-b border-gray-100 hover:bg-gray-50 ${
                      n.isRead ? "text-fg/60" : "text-fg font-semibold"
                    }`}
                  >
                    {notificationLabel(n)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
