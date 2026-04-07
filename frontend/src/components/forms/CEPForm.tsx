"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { lookupCep, formatCep } from "@/lib/cep-service";
import { useOnboardingStore } from "@/lib/onboarding";
import type { CepAddress } from "@bairronow/shared-types";

export default function CEPForm() {
  const router = useRouter();
  const setAddress = useOnboardingStore((s) => s.setAddress);
  const setStep = useOnboardingStore((s) => s.setStep);

  const [cep, setCep] = useState("");
  const [address, setLocalAddress] = useState<CepAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await lookupCep(cep);
      setLocalAddress(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar CEP");
      setLocalAddress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!address) return;
    setAddress(address);
    setStep("proof");
    router.push("/proof-upload/");
  };

  return (
    <div className="space-y-5">
      <FormField
        label="CEP"
        type="text"
        inputMode="numeric"
        placeholder="00000-000"
        value={cep}
        onChange={(e) => setCep(formatCep(e.target.value))}
        maxLength={9}
        error={error ?? undefined}
      />
      <Button
        type="button"
        onClick={handleLookup}
        loading={loading}
        fullWidth
        disabled={cep.replace(/\D/g, "").length !== 8}
      >
        Buscar endereço
      </Button>

      {address && (
        <Card bgColor="muted" padding="md">
          <div className="space-y-1 text-sm font-medium">
            <p className="text-fg/70">Endereço encontrado:</p>
            <p className="text-base font-bold text-fg">
              {address.logradouro || "(Logradouro não informado)"}
            </p>
            <p>
              {address.bairro} — {address.localidade}/{address.uf}
            </p>
            <p className="text-fg/70">CEP: {address.cep}</p>
          </div>
          <div className="mt-4">
            <Button type="button" variant="secondary" fullWidth onClick={handleConfirm}>
              Confirmar e continuar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
