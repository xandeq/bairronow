"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import ProofDropzone from "@/components/ProofDropzone";
import { verificationApi } from "@/lib/api";
import { useOnboardingStore } from "@/lib/onboarding";

export default function ProofUploadPage() {
  const router = useRouter();
  const address = useOnboardingStore((s) => s.address);
  const setProof = useOnboardingStore((s) => s.setProof);
  const setStep = useOnboardingStore((s) => s.setStep);
  const setStatus = useOnboardingStore((s) => s.setStatus);

  const [file, setFile] = useState<File | null>(null);
  const [numero, setNumero] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!file || !address) {
      setError("Selecione um comprovante e confirme o CEP antes.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("cep", address.cep);
      fd.append("numero", numero);
      fd.append("proof", file);
      const dto = await verificationApi.submit(fd);
      setProof(file.name);
      setStatus(dto);
      setStep("pending");
      router.push("/pending/");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Erro ao enviar comprovante";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Comprovante de residencia"
      subtitle="Passo 2 de 2 — Envie um documento que comprove seu endereco"
    >
      <div className="space-y-5">
        {address && (
          <div className="rounded-md bg-muted p-3 text-sm font-medium">
            <p className="text-fg/70">Endereco a verificar:</p>
            <p className="font-bold text-fg">
              {address.logradouro || "(sem logradouro)"} — {address.bairro}
            </p>
            <p>
              {address.localidade}/{address.uf} — CEP {address.cep}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-fg mb-1">
            Numero (opcional)
          </label>
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value.slice(0, 20))}
            className="w-full rounded-md border-2 border-border bg-bg px-3 py-2 font-medium focus:border-primary focus:outline-none"
            placeholder="Ex: 123 ap 401"
          />
        </div>

        <ProofDropzone onFile={setFile} />

        {error && <p className="text-sm text-danger font-semibold">{error}</p>}

        <Button
          type="button"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!file || !address}
          fullWidth
        >
          Enviar comprovante
        </Button>
      </div>
    </AuthLayout>
  );
}
