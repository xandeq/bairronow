import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Author } from "@/types/feed";

export default function ProfileCard({ user }: { user: Author }) {
  return (
    <Card padding="lg">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-2xl font-extrabold text-fg">{user.name}</h2>
            {user.verified && <Badge variant="secondary">Verificado</Badge>}
          </div>
          <p className="text-fg/70 font-medium">{user.bairro}</p>
        </div>
      </div>
    </Card>
  );
}
