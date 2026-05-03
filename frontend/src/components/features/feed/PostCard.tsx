import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import type { Post } from "@bairronow/shared-types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <Card interactive padding="md">
      <header className="flex items-center gap-3 mb-3">
        <Avatar name={post.author.name} size="md" verified={post.author.verified} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-fg truncate">{post.author.name}</p>
          <p className="text-xs text-muted-fg font-medium">
            {post.author.bairro} • {timeAgo(post.createdAt)}
          </p>
        </div>
      </header>
      <p className="text-fg leading-relaxed mb-4">{post.content}</p>
      <footer className="flex items-center gap-6 text-sm font-semibold text-muted-fg">
        <span>{post.likeCount} curtidas</span>
        <span>{post.commentCount} comentarios</span>
        <WhatsAppShareButton
          url={`https://bairronow.com.br/p/${post.id}`}
        />
      </footer>
    </Card>
  );
}
