import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
          {post.author.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-fg truncate">{post.author.name}</p>
            {post.author.verified && (
              <Badge variant="secondary">Verificado</Badge>
            )}
          </div>
          <p className="text-xs text-fg/60 font-medium">
            {post.author.bairro} • {timeAgo(post.createdAt)}
          </p>
        </div>
      </header>
      <p className="text-fg leading-relaxed mb-4">{post.content}</p>
      <footer className="flex items-center gap-6 text-sm font-semibold text-fg/70">
        <span>♥ {post.likeCount} curtidas</span>
        <span>💬 {post.commentCount} comentários</span>
      </footer>
    </Card>
  );
}
