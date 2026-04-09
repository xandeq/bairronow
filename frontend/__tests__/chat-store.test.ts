import { useChatStore } from "@/stores/chat-store";
import type { MessageDto } from "@/lib/types/marketplace";

jest.mock("@/lib/api/chat", () => ({
  listConversations: jest.fn(async () => []),
  sendMessage: jest.fn(async (_id: number, input: { text?: string }) => ({
    id: 999,
    conversationId: 1,
    senderId: "u1",
    text: input.text ?? null,
    imageUrl: null,
    sentAt: new Date().toISOString(),
  })),
  markRead: jest.fn(async () => undefined),
  getUnreadCount: jest.fn(async () => ({ total: 0 })),
}));

describe("chat-store", () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [],
      messagesByConversation: {},
      unreadTotal: 0,
      activeConversationId: null,
      connected: false,
      loading: false,
    });
  });

  it("appendMessage adds to the correct conversation and dedupes", () => {
    const msg: MessageDto = {
      id: 1,
      conversationId: 5,
      senderId: "u1",
      text: "oi",
      imageUrl: null,
      sentAt: new Date().toISOString(),
    };
    useChatStore.getState().appendMessage(5, msg);
    useChatStore.getState().appendMessage(5, msg);
    expect(useChatStore.getState().messagesByConversation[5]).toHaveLength(1);
  });

  it("sendMessage pushes into store via API", async () => {
    const res = await useChatStore
      .getState()
      .sendMessage(1, "hello");
    expect(res).not.toBeNull();
    expect(
      useChatStore.getState().messagesByConversation[1]?.[0]?.text
    ).toBe("hello");
  });
});
