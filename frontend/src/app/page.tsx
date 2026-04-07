"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const authed = useAuthStore.getState().isAuthenticated;
      router.replace(authed ? "/feed/" : "/login/");
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <p className="text-fg/60 font-medium">Carregando...</p>
    </div>
  );
}
