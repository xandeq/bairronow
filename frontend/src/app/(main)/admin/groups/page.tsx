'use client';
import { useEffect, useState } from 'react';
import { deleteGroupPost } from '@/lib/api/groups';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';

interface FlaggedPost {
  id: number;
  groupId: number;
  groupName: string;
  authorName: string;
  body: string;
}

export default function AdminGroupsPage() {
  const user = useAuthStore((s) => s.user);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);

  useEffect(() => {
    if (!user?.bairroId) return;
    api
      .get(`/api/v1/groups/flagged-posts?bairroId=${user.bairroId}`)
      .then((r) => setFlaggedPosts(r.data))
      .catch(() => setFlaggedPosts([]));
  }, [user?.bairroId]);

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Moderação de Grupos</h1>
      {flaggedPosts.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma publicação sinalizada.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Grupo</th>
              <th className="text-left py-2">Autor</th>
              <th className="text-left py-2">Conteúdo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {flaggedPosts.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.groupName}</td>
                <td className="py-2">{p.authorName}</td>
                <td className="py-2 max-w-xs truncate">{p.body}</td>
                <td className="py-2">
                  <button
                    onClick={() =>
                      deleteGroupPost(p.groupId, p.id).then(() =>
                        setFlaggedPosts((ps) => ps.filter((x) => x.id !== p.id))
                      )
                    }
                    className="text-red-600 hover:underline text-xs"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
