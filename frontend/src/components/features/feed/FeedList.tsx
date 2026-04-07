import PostCard from "./PostCard";
import type { Post } from "@bairronow/shared-types";

export default function FeedList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-center text-fg/60 font-medium py-12">
        Nenhuma publicação no momento.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
