"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ReportDto } from "@bairronow/shared-types";
import FeedHeader from "@/components/layouts/FeedHeader";
import { feedClient } from "@/lib/feed";
import { useAuthStore } from "@/lib/auth";

export default function ModerationPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.isAdmin === true;

  const [reports, setReports] = useState<ReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await feedClient.listPendingReports(0, 50);
      setReports(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao listar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleResolve = async (
    id: number,
    action: "dismiss" | "remove"
  ) => {
    setBusyId(id);
    try {
      await feedClient.resolveReport(id, action);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao resolver");
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <FeedHeader />
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-extrabold text-fg">Acesso negado</h1>
          <p className="text-fg/70 font-medium">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedHeader />
      <h1 className="text-2xl font-extrabold text-fg">Moderação</h1>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      {loading ? (
        <p className="text-fg/60 font-medium">Carregando...</p>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-fg/60 font-medium">
            Nenhuma denúncia pendente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left font-bold text-fg/70 border-b-2 border-gray-200">
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Alvo</th>
                <th className="px-3 py-2">Denunciante</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium">{r.targetType}</td>
                  <td className="px-3 py-2 font-medium">
                    {r.targetType === "post" ? (
                      <Link
                        href={`/feed/post/?id=${r.targetId}`}
                        className="text-green-700 underline font-bold"
                      >
                        #{r.targetId}
                      </Link>
                    ) : (
                      `#${r.targetId}`
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{r.reporterEmail}</td>
                  <td className="px-3 py-2 font-medium">{r.reason}</td>
                  <td className="px-3 py-2 text-fg/70">{r.note ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleResolve(r.id, "remove")}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded px-2 py-1 disabled:opacity-50"
                      >
                        Remover conteúdo
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleResolve(r.id, "dismiss")}
                        className="border-2 border-gray-300 text-fg text-xs font-semibold rounded px-2 py-1 disabled:opacity-50"
                      >
                        Dispensar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
