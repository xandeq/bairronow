"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Card from "@/components/ui/Card";
import VerifiedBadge from "@/components/VerifiedBadge";
import { profileApi } from "@/lib/api";
import { updateProfileSchema } from "@bairronow/shared-validators";
import type { ProfileDto } from "@bairronow/shared-types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    profileApi
      .getMe()
      .then((p) => {
        if (!mounted) return;
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setBio(p.bio ?? "");
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar perfil");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setError(null);
    const parsed = updateProfileSchema.safeParse({ displayName, bio });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados invalidos");
      return;
    }
    setSaving(true);
    try {
      const updated = await profileApi.updateMe(parsed.data);
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-fg/70 font-medium">Carregando perfil...</p>;
  }

  if (!profile) {
    return (
      <p className="text-danger font-semibold">
        {error ?? "Nao foi possivel carregar o perfil."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-3xl font-extrabold text-fg">Meu perfil</h1>
        <VerifiedBadge verified={profile.isVerified} />
      </header>

      <Card padding="md">
        {!editing ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase font-bold text-fg/60">Nome</p>
              <p className="font-bold text-fg">
                {profile.displayName ?? "(sem nome)"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-fg/60">Bio</p>
              <p className="font-medium text-fg">
                {profile.bio ?? "(sem bio)"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-fg/60">Bairro</p>
              <p className="font-medium text-fg">
                {profile.bairroNome ?? "(nao definido)"}
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Editar perfil
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FormField
              label="Nome de exibicao"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
            />
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full rounded-md border-2 border-border bg-bg px-3 py-2 font-medium focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-fg/60 mt-1">{bio.length}/160</p>
            </div>
            {error && (
              <p className="text-sm text-danger font-semibold">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSave}
                loading={saving}
              >
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setDisplayName(profile.displayName ?? "");
                  setBio(profile.bio ?? "");
                  setError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
