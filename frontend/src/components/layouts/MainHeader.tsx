"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { useChatStore } from "@/stores/chat-store";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/feed/", label: "Feed" },
  { href: "/marketplace/", label: "Marketplace" },
  { href: "/chat/", label: "Mensagens", badge: true },
  { href: "/profile/", label: "Perfil" },
];

export default function MainHeader() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connect = useChatStore((s) => s.connect);
  const loadUnread = useChatStore((s) => s.loadUnread);
  const unreadTotal = useChatStore((s) => s.unreadTotal);

  // Wire chat unread badge to the shared hub (single connection).
  useEffect(() => {
    if (!isAuthenticated) return;
    void connect();
    void loadUnread();
  }, [isAuthenticated, connect, loadUnread]);

  const handleLogout = () => {
    logout();
    router.push("/login/");
  };

  return (
    <header className="relative z-10 px-6 py-4 border-b-2 border-border bg-bg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/feed/" className="text-2xl font-extrabold text-primary">
          BairroNow
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-2 text-sm sm:text-base font-semibold rounded-md hover:bg-muted transition-colors"
            >
              {item.label}
              {item.badge && unreadTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              )}
            </Link>
          ))}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm sm:text-base font-semibold rounded-md text-danger hover:bg-muted transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
