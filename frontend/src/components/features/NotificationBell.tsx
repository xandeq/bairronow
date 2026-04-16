"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NotificationDto } from "@bairronow/shared-types";
import { getHubConnection } from "@/lib/signalr";
import { useNotificationStore } from "@/stores/notification-store";

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
    let mounted = true;
    let cleanup: (() => void) | null = null;

    load();

    // Reuse the shared singleton hub — never open a second connection.
    getHubConnection()
      .then((hub) => {
        if (!mounted) return;
        const handler = (dto: NotificationDto) => {
          if (mounted) prepend(dto);
        };
        hub.on("notification", handler);
        cleanup = () => {
          try {
            hub.off("notification", handler);
          } catch {
            // best-effort
          }
        };
      })
      .catch(() => {
        // best-effort: hub down doesn't break the page
      });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, [load, prepend]);

  const last10 = items.slice(0, 10);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative p-2 rounded-md hover:bg-muted"
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
        <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-40">
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
                    className={`block p-3 text-sm border-b border-border hover:bg-muted ${
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
