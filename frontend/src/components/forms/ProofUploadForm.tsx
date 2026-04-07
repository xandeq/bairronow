"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useOnboardingStore } from "@/lib/onboarding";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function ProofUploadForm() {
  const router = useRouter();
  const setProof = useOnboardingStore((s) => s.setProof);
  const setStep = useOnboardingStore((s) => s.setStep);
  const setProofStatus = useOnboardingStore((s) => s.setProofStatus);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File | null) => {
    setError(null);
    setPreview(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato inválido. Use JPG, PNG, WEBP ou PDF.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    setProof(file.name);
    setProofStatus("pending");
    setStep("pending");
    router.push("/pending/");
  };

  return (
    <div className="space-y-5">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-muted"
            : "border-border bg-bg hover:border-primary hover:bg-muted",
        ].join(" ")}
      >
        <p className="font-bold text-fg">
          Arraste o comprovante aqui ou clique para selecionar
        </p>
        <p className="text-sm text-fg/60 mt-2 font-medium">
          JPG, PNG, WEBP ou PDF — máx. 5MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <p className="text-sm text-danger font-semibold">{error}</p>
      )}

      {file && (
        <Card bgColor="muted" padding="md">
          <p className="font-bold text-fg">{file.name}</p>
          <p className="text-sm text-fg/60 font-medium">
            {(file.size / 1024).toFixed(1)} KB
          </p>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pré-visualização do comprovante"
              className="mt-3 max-h-48 rounded-md border-2 border-border"
            />
          )}
        </Card>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!file}
        fullWidth
      >
        Enviar comprovante
      </Button>
    </div>
  );
}
