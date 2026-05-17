'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { getGroups } from '@/lib/api/groups';
import type { Group, GroupCategory } from '@/lib/types/groups';

const CATEGORY_COLORS: Record<GroupCategory, string> = {
  Esportes: 'bg-secondary text-secondary-fg',
  Animais: 'bg-accent text-accent-fg',
  Pais: 'bg-secondary text-secondary-fg',
  Seguranca: 'bg-danger/10 text-danger',
  Jardinagem: 'bg-secondary text-secondary-fg',
  Negocios: 'bg-primary/10 text-primary',
  Cultura: 'bg-accent/20 text-accent-fg',
  Outros: 'bg-muted text-fg',
};

export default function GroupsPage() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.bairroId) return;
    setLoading(true);
    getGroups(user.bairroId, { search: search || undefined })
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [user?.bairroId, search]);

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-fg">Grupos do Bairro</h1>
        <Link
          href="/groups/new"
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          Criar Grupo
        </Link>
      </div>

      <input
        type="search"
        placeholder="Buscar grupos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-border rounded-xl px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-primary/30 focus:border-transparent"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted animate-pulse rounded-xl h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              data-testid="group-card"
              className="bg-card rounded-xl shadow-sm border border-border p-4 flex flex-col gap-2"
            >
              {g.coverImageUrl && (
                <img src={g.coverImageUrl} alt={g.name} className="h-24 w-full object-cover rounded-lg" />
              )}
              <div className="flex items-start justify-between">
                <Link href={`/groups/${g.id}`} className="font-semibold text-fg hover:text-primary leading-tight">
                  {g.name}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[g.category]}`}>
                  {g.category}
                </span>
              </div>
              <p className="text-sm text-muted-fg line-clamp-2">{g.description}</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                <span className="text-xs text-muted-fg">{g.memberCount} membros</span>
                <span className="text-xs text-muted-fg">{g.joinPolicy === 'Open' ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
