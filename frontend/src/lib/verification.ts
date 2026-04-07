"use client";

import { useEffect, useState } from "react";
import type { VerificationStatusDto } from "@bairronow/shared-types";
import { verificationApi } from "./api";

export function useVerificationPolling(intervalMs = 5000) {
  const [status, setStatus] = useState<VerificationStatusDto | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      try {
        const dto = await verificationApi.getMyStatus();
        if (!mounted) return;
        setStatus(dto);
        setLastUpdate(new Date());
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Erro ao consultar status");
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { status, lastUpdate, error };
}
