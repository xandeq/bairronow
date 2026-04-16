"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ReportDto, ReportTargetType } from "@bairronow/shared-types";
import FeedHeader from "@/components/layouts/FeedHeader";
import { feedClient } from "@/lib/feed";
import { useAuthStore } from "@/lib/auth";

// Phase 4 Plan 02 Task 2: extended unified moderation queue — posts + comments + listings.
// Shared queue per Phase 4 D-21 — same endpoint, discriminated by targetType.

type TargetFilter = "all" | ReportTargetType;

const TYPE_LABELS: Record<ReportTargetType, string> = {
  post: "Post",
  comment: "Comentário",
  listing: "Anúncio",
};

const TYPE_BADGE: Record<ReportTargetType, string> = {
  post: "bg-blue-100 text-blue-800 ring-blue-300",
  comment: "bg-purple-100 text-purple-800 ring-purple-300",
  listing: "bg-green-100 text-green-800 ring-green-300",
};

export default function ModerationPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.isAdmin === true;

  const [reports, setReports] = useState<ReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<TargetFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await feedClient.listPendingReports(0, 100);
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

  const filtered = useMemo(
    () =>
      filter === "all"
        ? reports
        : reports.filter((r) => r.targetType === filter),
    [reports, filter]
  );

  const handleResolve = async (id: number, action: "dismiss" | "remove") => {
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
        <div className="bg-bg rounded-lg border-2 border-border p-6">
          <h1 className="text-xl font-extrabold text-fg">Acesso negado</h1>
        </div>
      </div>
    );
  }

  const filters: Array<{ code: TargetFilter; label: string }> = [
    { code: "all", label: "Todos" },
    { code: "post", label: "Posts" },
    { code: "comment", label: "Comentários" },
    { code: "listing", label: "Anúncios" },
  ];

  return (
    <div className="space-y-4">
      <FeedHeader />
      <h1 className="text-2xl font-extrabold text-fg">Moderação</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.code}
            type="button"
            onClick={() => setFilter(f.code)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
              filter === f.code
                ? "bg-primary text-white border-primary"
                : "bg-bg text-fg border-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      {loading ? (
        <p className="text-fg/60 font-medium">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-bg rounded-lg border-2 border-border p-6">
          <p className="text-fg/60 font-medium">Nenhuma denúncia pendente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-bg rounded-lg border-2 border-border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left font-bold text-fg/70 border-b-2 border-border">
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Alvo</th>
                <th className="px-3 py-2">Denunciante</th>
                <th className="px-3 py-2">Motivo</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block text-xs font-bold rounded-full px-2 py-0.5 ring-1 ${
                        TYPE_BADGE[r.targetType] ??
                        "bg-muted text-fg ring-border"
                      }`}
                    >
                      {TYPE_LABELS[r.targetType] ?? r.targetType}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.targetType === "post" ? (
                      <Link
                        href={`/feed/post/?id=${r.targetId}`}
                        className="text-green-700 underline font-bold"
                      >
                        #{r.targetId}
                      </Link>
                    ) : r.targetType === "listing" ? (
                      <Link
                        href={`/marketplace/${r.targetId}/`}
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
                        Remover
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => handleResolve(r.id, "dismiss")}
                        className="border-2 border-border text-fg text-xs font-semibold rounded px-2 py-1 disabled:opacity-50"
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
