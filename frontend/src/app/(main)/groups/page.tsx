'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { getGroups } from '@/lib/api/groups';
import type { Group, GroupCategory } from '@/lib/types/groups';

const CATEGORY_COLORS: Record<GroupCategory, string> = {
  Esportes: 'bg-blue-100 text-blue-800',
  Animais: 'bg-yellow-100 text-yellow-800',
  Pais: 'bg-pink-100 text-pink-800',
  Seguranca: 'bg-red-100 text-red-800',
  Jardinagem: 'bg-green-100 text-green-800',
  Negocios: 'bg-purple-100 text-purple-800',
  Cultura: 'bg-orange-100 text-orange-800',
  Outros: 'bg-gray-100 text-gray-800',
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
        <h1 className="text-2xl font-semibold text-gray-900">Grupos do Bairro</h1>
        <Link
          href="/groups/new"
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Criar Grupo
        </Link>
      </div>

      <input
        type="search"
        placeholder="Buscar grupos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              data-testid="group-card"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2"
            >
              {g.coverImageUrl && (
                <img src={g.coverImageUrl} alt={g.name} className="h-24 w-full object-cover rounded-lg" />
              )}
              <div className="flex items-start justify-between">
                <Link href={`/groups/${g.id}`} className="font-semibold text-gray-900 hover:text-green-700 leading-tight">
                  {g.name}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[g.category]}`}>
                  {g.category}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{g.description}</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">{g.memberCount} membros</span>
                <span className="text-xs text-gray-400">{g.joinPolicy === 'Open' ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
