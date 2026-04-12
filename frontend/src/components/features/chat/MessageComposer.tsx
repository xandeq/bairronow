"use client";

import { useRef, useState } from "react";

export interface MessageComposerProps {
  onSend: (text?: string, image?: File) => Promise<void> | void;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function MessageComposer({
  onSend,
  disabled,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSend = (text.trim().length > 0 || image !== null) && !submitting;

  const submit = async () => {
    if (!canSend) return;
    setSubmitting(true);
    try {
      await onSend(text.trim() || undefined, image ?? undefined);
      setText("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setSubmitting(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="border-t-2 border-border bg-bg p-3 space-y-2">
      {image && (
        <div className="flex items-center gap-2 text-xs text-fg/70">
          <span className="font-semibold">📎 {image.name}</span>
          <button
            type="button"
            onClick={() => setImage(null)}
            className="text-red-600 font-bold"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || submitting}
          aria-label="Anexar imagem"
          className="border-2 border-border rounded p-2 text-lg"
        >
          📷
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > MAX_IMAGE_SIZE) {
              alert("Imagem máxima 5MB");
              return;
            }
            setImage(f);
          }}
        />
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Escreva uma mensagem..."
          disabled={disabled || submitting}
          className="flex-1 border-2 border-border rounded px-3 py-2 text-sm font-medium resize-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend || disabled}
          className="bg-primary text-white font-extrabold px-4 py-2 rounded disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
