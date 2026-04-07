"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

const navItems = [
  { href: "/feed/", label: "Feed" },
  { href: "/marketplace/", label: "Marketplace" },
  { href: "/profile/", label: "Perfil" },
];

export default function MainHeader() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

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
        <nav className="flex items-center gap-2 sm:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm sm:text-base font-semibold rounded-md hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
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
