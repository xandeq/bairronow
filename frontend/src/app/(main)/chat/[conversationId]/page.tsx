import ChatRoomClient from "./ChatRoomClient";

// Next.js static export requires at least one pre-rendered route for dynamic segments.
// We provide a placeholder slug "0" — the actual conversation is resolved client-side
// via useParams() and authenticated API calls.
export async function generateStaticParams() {
  return [{ conversationId: "0" }];
}

export const dynamicParams = false;

export default function ChatRoomPage() {
  return <ChatRoomClient />;
}
