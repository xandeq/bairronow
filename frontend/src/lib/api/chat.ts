import api from "@/lib/api";
import type {
  ConversationDto,
  MessageDto,
  UnreadCountResponse,
} from "@/lib/types/marketplace";

// Phase 4 Plan 02 Task 0: chat API wrappers matching
// src/BairroNow.Api/Controllers/v1/ChatController.cs

const BASE = "/api/v1/chat";

export async function listConversations(): Promise<ConversationDto[]> {
  const { data } = await api.get<ConversationDto[]>(`${BASE}/conversations`);
  return data;
}

export async function createConversation(
  listingId: number
): Promise<ConversationDto> {
  const { data } = await api.post<ConversationDto>(`${BASE}/conversations`, {
    listingId,
  });
  return data;
}

export async function getMessageHistory(
  conversationId: number,
  before?: string,
  limit = 50
): Promise<MessageDto[]> {
  const { data } = await api.get<MessageDto[]>(
    `${BASE}/conversations/${conversationId}/messages`,
    {
      params: { before, limit },
    }
  );
  return data;
}

export interface SendMessageInput {
  text?: string;
  image?: File;
}

export async function sendMessage(
  conversationId: number,
  input: SendMessageInput
): Promise<MessageDto> {
  const fd = new FormData();
  if (input.text) fd.append("text", input.text);
  if (input.image) fd.append("image", input.image, input.image.name);
  const { data } = await api.post<MessageDto>(
    `${BASE}/conversations/${conversationId}/messages`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function markRead(conversationId: number): Promise<void> {
  await api.post(`${BASE}/conversations/${conversationId}/read`, {});
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await api.get<UnreadCountResponse>(`${BASE}/unread-count`);
  return data;
}
