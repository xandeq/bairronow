"use client";

import Link from "next/link";
import NotificationBell from "@/components/features/NotificationBell";
import { useAuthStore } from "@/lib/auth";

export default function FeedHeader() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.isAdmin === true;

  return (
    <header className="flex items-center justify-between bg-bg border border-border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-4">
        <Link href="/feed/" className="text-xl font-extrabold text-green-700">
          BairroNow
        </Link>
        <span className="text-sm text-fg/60 font-medium hidden sm:inline">
          {user?.bairroName ?? `Bairro #${user?.bairroId ?? "?"}`}
        </span>
      </div>
      <nav className="flex items-center gap-3">
        <Link
          href="/feed/search/"
          className="text-sm font-semibold text-fg/70 hover:text-green-700"
        >
          Buscar
        </Link>
        {isAdmin && (
          <Link
            href="/admin/moderation/"
            className="text-sm font-semibold text-fg/70 hover:text-green-700"
          >
            Moderação
          </Link>
        )}
        <NotificationBell />
      </nav>
    </header>
  );
}
