'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  getPendingWhatsAppGroups, verifyWhatsAppGroup, rejectWhatsAppGroup,
  getPendingClaims, approveClaim, rejectClaim,
} from '@/lib/api/community';
import type { PendingWhatsAppGroup, PendingClaim } from '@/lib/types/community';
import { WHATSAPP_KIND_LABELS } from '@/lib/types/community';

export default function AdminCommunityPage() {
  const [groups, setGroups] = useState<PendingWhatsAppGroup[]>([]);
  const [claims, setClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyGroup, setBusyGroup] = useState<number | null>(null);
  const [busyClaim, setBusyClaim] = useState<number | null>(null);
  const [rejectGroupId, setRejectGroupId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, c] = await Promise.all([getPendingWhatsAppGroups(), getPendingClaims()]);
      setGroups(g);
      setClaims(c);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 403) setForbidden(true);
      else setError(e instanceof Error ? e.message : 'Erro ao carregar a fila.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id: number, official: boolean) => {
    setBusyGroup(id);
    try {
      await verifyWhatsAppGroup(id, official);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao verificar.');
    } finally {
      setBusyGroup(null);
    }
  };

  const handleRejectGroup = async () => {
    if (rejectGroupId == null) return;
    const id = rejectGroupId;
    const reason = rejectReason.trim();
    setRejectGroupId(null);
    setRejectReason('');
    setBusyGroup(id);
    try {
      await rejectWhatsAppGroup(id, reason || 'Não atende às diretrizes.');
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao rejeitar.');
    } finally {
      setBusyGroup(null);
    }
  };

  const handleApproveClaim = async (id: number) => {
    setBusyClaim(id);
    try {
      await approveClaim(id);
      setClaims((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao aprovar.');
    } finally {
      setBusyClaim(null);
    }
  };

  const handleRejectClaim = async (id: number) => {
    setBusyClaim(id);
    try {
      await rejectClaim(id);
      setClaims((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao rejeitar.');
    } finally {
      setBusyClaim(null);
    }
  };

  if (forbidden) {
    return (
      <Card padding="md">
        <h1 className="text-2xl font-extrabold text-fg">Acesso negado</h1>
        <p className="mt-2 text-fg/70 font-medium">Você não tem permissão para acessar esta área.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <header>
        <h1 className="text-3xl font-extrabold text-fg">Moderação — Comunidade</h1>
        <p className="text-muted-fg font-medium">Grupos de WhatsApp e reivindicações de síndico aguardando análise.</p>
      </header>

      {error && <p className="text-sm text-danger font-semibold">{error}</p>}

      {/* ── Grupos de WhatsApp pendentes ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-fg">Grupos de WhatsApp</h2>
          <span className="text-sm font-semibold text-fg/70">{groups.length} pendente(s)</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-card border border-border/50 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card padding="md"><p className="text-fg/70 font-medium">Nenhum grupo pendente.</p></Card>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.id} className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-fg">{g.name} <Badge variant="accent">{WHATSAPP_KIND_LABELS[g.kind]}</Badge></p>
                    {g.description && <p className="text-sm text-muted-fg line-clamp-2">{g.description}</p>}
                    <a href={g.inviteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline break-all">
                      {g.inviteUrl}
                    </a>
                    <p className="text-xs text-muted-fg mt-1">
                      Enviado por {g.submittedBy ?? '—'}
                      {g.memberCountApprox != null && ` · ~${g.memberCountApprox} membros`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="secondary" size="sm" loading={busyGroup === g.id} onClick={() => handleVerify(g.id, false)}>
                    Verificar
                  </Button>
                  <Button variant="primary" size="sm" loading={busyGroup === g.id} onClick={() => handleVerify(g.id, true)}>
                    Verificar como oficial
                  </Button>
                  <Button variant="outline" size="sm" loading={busyGroup === g.id} onClick={() => { setRejectGroupId(g.id); setRejectReason(''); }}>
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Reivindicações de síndico ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-fg">Reivindicações de síndico</h2>
          <span className="text-sm font-semibold text-fg/70">{claims.length} pendente(s)</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 bg-card border border-border/50 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <Card padding="md"><p className="text-fg/70 font-medium">Nenhuma reivindicação pendente.</p></Card>
        ) : (
          <div className="space-y-3">
            {claims.map((c) => (
              <div key={c.id} className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-fg">
                      {c.condominiumName}{' '}
                      <Badge variant="accent">{c.requestedRole}</Badge>
                    </p>
                    <p className="text-sm text-fg/80">
                      {c.claimantName ?? '—'}{' '}
                      {c.claimantVerified && <Badge variant="secondary">verificado</Badge>}
                    </p>
                    <p className="text-sm text-muted-fg italic">&ldquo;{c.justification}&rdquo;</p>
                    {c.evidenceUrl && (
                      <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                        Ver comprovante
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="primary" size="sm" loading={busyClaim === c.id} onClick={() => handleApproveClaim(c.id)}>
                    Aprovar (transferir perfil)
                  </Button>
                  <Button variant="outline" size="sm" loading={busyClaim === c.id} onClick={() => handleRejectClaim(c.id)}>
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reject group modal */}
      {rejectGroupId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-fg mb-2">Rejeitar grupo</h3>
            <p className="text-sm text-muted-fg mb-3">Motivo (opcional):</p>
            <textarea
              className="w-full rounded-xl border border-border/50 bg-muted text-fg text-sm p-2 mb-5 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: link inválido, spam, não é do bairro..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectGroupId(null); setRejectReason(''); }} className="px-4 py-2 text-sm rounded-xl text-muted-fg hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button onClick={handleRejectGroup} className="px-4 py-2 text-sm rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors">
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
