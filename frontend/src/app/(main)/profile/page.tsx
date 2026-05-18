"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { profileApi } from "@/lib/api";
import { updateProfileSchema } from "@bairronow/shared-validators";
import type { ProfileDto } from "@bairronow/shared-types";

function StoreIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13.5 19.79 19.79 0 0 1 1.07 4.84 2 2 0 0 1 3.04 2.66h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
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
        setIsBusinessAccount(p.isBusinessAccount ?? false);
        setBusinessName(p.businessName ?? "");
        setBusinessCategory(p.businessCategory ?? "");
        setBusinessDescription(p.businessDescription ?? "");
        setBusinessPhone(p.businessPhone ?? "");
        setBusinessWebsite(p.businessWebsite ?? "");
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
    if (isBusinessAccount && !businessName.trim()) {
      setError("Nome do negocio e obrigatorio");
      return;
    }
    setSaving(true);
    try {
      const updated = await profileApi.updateMe({
        ...parsed.data,
        isBusinessAccount,
        businessName: isBusinessAccount ? businessName : undefined,
        businessCategory: isBusinessAccount ? businessCategory : undefined,
        businessDescription: isBusinessAccount ? businessDescription : undefined,
        businessPhone: isBusinessAccount ? businessPhone : undefined,
        businessWebsite: isBusinessAccount ? businessWebsite : undefined,
      });
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setEditing(false);
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setIsBusinessAccount(profile.isBusinessAccount ?? false);
    setBusinessName(profile.businessName ?? "");
    setBusinessCategory(profile.businessCategory ?? "");
    setBusinessDescription(profile.businessDescription ?? "");
    setBusinessPhone(profile.businessPhone ?? "");
    setBusinessWebsite(profile.businessWebsite ?? "");
    setError(null);
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
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={profile.displayName ?? profile.bairroNome ?? "?"}
            verified={profile.isVerified}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-fg leading-tight">
              {profile.displayName ?? "(sem nome)"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-fg font-medium">
                {profile.bairroNome ?? "Bairro nao definido"}
              </span>
              <VerifiedBadge verified={profile.isVerified} />
            </div>
          </div>
        </div>
        <Link
          href="/profile/settings/"
          className="text-sm text-primary font-semibold hover:underline mt-1"
        >
          Configuracoes
        </Link>
      </header>

      <Card padding="md">
        {!editing ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase font-bold text-fg/60">Bio</p>
              <p className="font-medium text-fg">
                {profile.bio ?? "(sem bio)"}
              </p>
            </div>

            {profile.isBusinessAccount && (
              <div className="pt-2 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent">
                  <StoreIcon />
                  Negocio local
                </span>
                {profile.businessName && (
                  <p className="font-semibold text-fg text-base">{profile.businessName}</p>
                )}
                <div className="space-y-1.5">
                  {profile.businessCategory && (
                    <div className="flex items-center gap-2 text-sm text-muted-fg">
                      <StoreIcon />
                      <span>{profile.businessCategory}</span>
                    </div>
                  )}
                  {profile.businessPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-fg">
                      <PhoneIcon />
                      <span>{profile.businessPhone}</span>
                    </div>
                  )}
                  {profile.businessWebsite && (
                    <div className="flex items-center gap-2 text-sm text-muted-fg">
                      <GlobeIcon />
                      <a
                        href={profile.businessWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.businessWebsite}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                className="w-full px-4 py-2.5 rounded-lg bg-muted text-fg placeholder:text-muted-fg border-2 border-transparent outline-none transition-colors duration-150 focus:bg-card focus:border-primary font-medium resize-none"
              />
              <p className="text-xs text-fg/60 mt-1">{bio.length}/160</p>
            </div>

            <div className="border-t border-border/60 pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isBusinessAccount}
                    onChange={(e) => setIsBusinessAccount(e.target.checked)}
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                      isBusinessAccount ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      isBusinessAccount ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">Conta Negocio</p>
                  <p className="text-xs text-muted-fg">Exibe seu negocio no mapa do bairro</p>
                </div>
              </label>

              {isBusinessAccount && (
                <div className="space-y-4 pl-1">
                  <FormField
                    label="Nome do negocio"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="Ex: Padaria Boa Vista"
                  />
                  <FormField
                    label="Categoria"
                    type="text"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    maxLength={80}
                    placeholder="Ex: Alimentacao, Servicos, Comercio"
                  />
                  <div>
                    <label className="block text-sm font-semibold text-fg mb-1">
                      Descricao
                    </label>
                    <textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      maxLength={300}
                      rows={3}
                      placeholder="Conte um pouco sobre seu negocio..."
                      className="w-full px-4 py-2.5 rounded-lg bg-muted text-fg placeholder:text-muted-fg border-2 border-transparent outline-none transition-colors duration-150 focus:bg-card focus:border-primary font-medium resize-none"
                    />
                    <p className="text-xs text-fg/60 mt-1">{businessDescription.length}/300</p>
                  </div>
                  <FormField
                    label="Telefone"
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    maxLength={20}
                    placeholder="Ex: (27) 99999-0000"
                  />
                  <FormField
                    label="Website"
                    type="url"
                    value={businessWebsite}
                    onChange={(e) => setBusinessWebsite(e.target.value)}
                    maxLength={200}
                    placeholder="https://..."
                  />
                </div>
              )}
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
                onClick={handleCancel}
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
