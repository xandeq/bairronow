"use client";

import ProfileCard from "@/components/features/profile/ProfileCard";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const profile = {
    id: user?.id ?? "stub",
    name: user?.displayName ?? user?.email ?? "Vizinho",
    bairro: "Praia da Costa, Vila Velha",
    verified: true,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-fg">Meu perfil</h1>
      </header>
      <ProfileCard user={profile} />
      <div className="flex gap-3">
        <Button variant="outline">Editar perfil</Button>
        <Button variant="secondary">Configurações</Button>
      </div>
    </div>
  );
}
