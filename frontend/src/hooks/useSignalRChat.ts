"use client";

import { useEffect } from "react";
import { getHubConnection } from "@/lib/signalr";
import { useChatStore } from "@/stores/chat-store";

// Phase 4 Plan 02 Task 2: SignalR chat hook.
// REUSES the shared HubConnection singleton from @/lib/signalr (`getHubConnection`).
// Does NOT call `new HubConnectionBuilder()` — the plan requires a single connection
// shared with the Phase 3 notifications bell.
//
// On mount: ensures handlers are wired (via chatStore.connect()) and invokes
// JoinConversation(conversationId). On unmount: LeaveConversation.

export function useSignalRChat(conversationId: number | null) {
  const connect = useChatStore((s) => s.connect);
  const setActive = useChatStore((s) => s.setActive);

  useEffect(() => {
    let cancelled = false;
    let joined = false;

    (async () => {
      try {
        await connect();
        const hub = await getHubConnection();
        if (cancelled || conversationId == null) return;
        await hub.invoke("JoinConversation", conversationId);
        joined = true;
        setActive(conversationId);
      } catch {
        // best-effort — hub outages don't break the page
      }
    })();

    return () => {
      cancelled = true;
      setActive(null);
      if (joined && conversationId != null) {
        (async () => {
          try {
            const hub = await getHubConnection();
            await hub.invoke("LeaveConversation", conversationId);
          } catch {
            // best-effort
          }
        })();
      }
    };
  }, [conversationId, connect, setActive]);
}
