"use client";

import { useEffect } from "react";
import ConversationList from "@/components/features/chat/ConversationList";
import { useChatStore } from "@/stores/chat-store";

export default function ChatListPage() {
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const connect = useChatStore((s) => s.connect);
  const loading = useChatStore((s) => s.loading);

  useEffect(() => {
    void connect();
    void loadConversations();
  }, [connect, loadConversations]);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-extrabold text-fg">Mensagens</h1>
        <p className="text-fg/60 font-medium">Suas conversas com vizinhos</p>
      </header>

      {loading ? (
        <p className="text-fg/60 font-medium">Carregando...</p>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
