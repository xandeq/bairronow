"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import ChatRoom from "@/components/features/chat/ChatRoom";
import { useChatStore } from "@/stores/chat-store";

export default function ChatRoomClient() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = Number(params?.conversationId);
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const connect = useChatStore((s) => s.connect);

  useEffect(() => {
    void connect();
    if (conversations.length === 0) void loadConversations();
  }, [connect, conversations.length, loadConversations]);

  const conversation =
    conversations.find((c) => c.id === conversationId) ?? null;

  if (!conversationId || Number.isNaN(conversationId)) {
    return <p className="text-red-600 font-semibold">Conversa inválida</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ChatRoom
        conversationId={conversationId}
        conversation={conversation}
      />
    </div>
  );
}
