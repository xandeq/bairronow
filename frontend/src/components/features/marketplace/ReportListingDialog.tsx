"use client";

import { useState } from "react";
import {
  LISTING_REPORT_REASONS,
  type ListingReportReasonCode,
} from "@/lib/types/marketplace";
import { reportListing } from "@/lib/api/marketplace";

// D-20: fixed reason list, optional details textarea.

export interface ReportListingDialogProps {
  listingId: number;
  onClose: () => void;
}

export default function ReportListingDialog({
  listingId,
  onClose,
}: ReportListingDialogProps) {
  const [reason, setReason] = useState<ListingReportReasonCode | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    const match = LISTING_REPORT_REASONS.find((r) => r.code === reason);
    if (!match) return;
    try {
      await reportListing(listingId, {
        reason: match.backend,
        note: note
          ? `[${match.label}] ${note}`
          : match.label,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao denunciar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Denunciar anúncio"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-bg border-2 border-border rounded-lg max-w-md w-full p-5 space-y-4">
        <h2 className="text-xl font-extrabold text-fg">Denunciar anúncio</h2>

        {submitted ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-fg">
              Denúncia enviada. Obrigado!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-primary text-white font-extrabold py-2 rounded-lg"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {LISTING_REPORT_REASONS.map((r) => (
                <label
                  key={r.code}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.code}
                    checked={reason === r.code}
                    onChange={() => setReason(r.code)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-fg">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detalhes (opcional)"
              className="w-full border-2 border-border rounded px-3 py-2 text-sm"
            />

            {error && (
              <p className="text-sm text-red-600 font-semibold">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border-2 border-border text-fg font-semibold py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!reason || submitting}
                className="flex-1 bg-red-600 text-white font-extrabold py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Denunciar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
