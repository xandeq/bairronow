"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import PageLayout from "@/components/layouts/PageLayout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Hydration: zustand persist rehydrates after mount, so check on next tick.
    const t = setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace("/login/");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [router, isAuthenticated]);

  return <PageLayout>{children}</PageLayout>;
}
