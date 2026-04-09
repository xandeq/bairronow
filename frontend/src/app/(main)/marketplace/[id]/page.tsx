"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import ListingDetailGallery from "@/components/features/marketplace/ListingDetailGallery";
import ReportListingDialog from "@/components/features/marketplace/ReportListingDialog";
import RatingForm from "@/components/features/marketplace/RatingForm";
import { useAuthStore } from "@/lib/auth";
import {
  getListing,
  toggleFavorite,
  markSold,
  deleteListing,
  getSellerRatings,
} from "@/lib/api/marketplace";
import { createConversation } from "@/lib/api/chat";
import type {
  ListingDto,
  RatingDto,
  SellerRatingsResponse,
} from "@/lib/types/marketplace";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const listingId = Number(params?.id);

  const [listing, setListing] = useState<ListingDto | null>(null);
  const [ratings, setRatings] = useState<SellerRatingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [existingRating, setExistingRating] = useState<RatingDto | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListing(listingId);
      setListing(data);
      setFavorited(data.isFavoritedByCurrentUser);
      const r = await getSellerRatings(data.sellerId);
      setRatings(r);
      if (user) {
        const mine =
          r.ratings.find(
            (x) => x.buyerId === user.id && x.listingId === data.id
          ) ?? null;
        setExistingRating(mine);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [listingId, user]);

  useEffect(() => {
    if (listingId) load();
  }, [listingId, load]);

  if (loading) return <p className="text-fg/60 font-medium">Carregando...</p>;
  if (error || !listing)
    return (
      <p className="text-red-600 font-semibold">
        {error ?? "Anúncio não encontrado"}
      </p>
    );

  const isOwner = user?.id === listing.sellerId;
  const isSold = listing.status === "sold";

  const startChat = async () => {
    setBusy(true);
    try {
      const conv = await createConversation(listing.id);
      router.push(`/chat/${conv.id}/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar chat");
    } finally {
      setBusy(false);
    }
  };

  const onFavorite = async () => {
    try {
      const res = await toggleFavorite(listing.id);
      setFavorited(res.favorited);
    } catch {
      // best-effort
    }
  };

  const onMarkSold = async () => {
    setBusy(true);
    try {
      const updated = await markSold(listing.id);
      setListing(updated);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Remover este anúncio?")) return;
    setBusy(true);
    try {
      await deleteListing(listing.id);
      router.push("/marketplace/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <ListingDetailGallery photos={listing.photos} title={listing.title} />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-fg flex-1">
            {listing.title}
          </h1>
          {isSold && (
            <span className="bg-red-600 text-white font-extrabold px-3 py-1 rounded">
              VENDIDO
            </span>
          )}
        </div>
        <p className="text-3xl text-primary font-extrabold">
          {BRL.format(listing.price)}
        </p>
        <p className="text-sm text-fg/60 font-medium">
          Publicado em {new Date(listing.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="bg-bg border-2 border-border rounded-lg p-4 space-y-2">
        <h2 className="font-bold text-fg">Vendedor</h2>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-fg">
            {listing.sellerDisplayName}
          </span>
          {listing.sellerIsVerified && <VerifiedBadge verified size="sm" />}
        </div>
        {ratings && ratings.count > 0 && (
          <p className="text-sm text-fg/60 font-medium">
            ★ {ratings.average.toFixed(1)} ({ratings.count} avaliações)
          </p>
        )}
      </div>

      <div className="bg-bg border-2 border-border rounded-lg p-4">
        <h2 className="font-bold text-fg mb-2">Descrição</h2>
        <p className="text-fg/80 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {!isOwner && !isSold && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startChat}
            disabled={busy}
            className="flex-1 bg-primary text-white font-extrabold py-3 rounded-lg disabled:opacity-50"
          >
            Chat com vendedor
          </button>
          <button
            type="button"
            onClick={onFavorite}
            aria-label="Favoritar"
            className="border-2 border-border rounded-lg px-4 text-2xl"
          >
            {favorited ? "❤️" : "🤍"}
          </button>
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="border-2 border-red-400 text-red-600 font-semibold rounded-lg px-4"
          >
            Denunciar
          </button>
        </div>
      )}

      {isOwner && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/marketplace/${listing.id}/edit/`}
            className="border-2 border-border font-semibold px-4 py-2 rounded-lg"
          >
            Editar
          </Link>
          {!isSold && (
            <button
              type="button"
              onClick={onMarkSold}
              disabled={busy}
              className="bg-amber-500 text-white font-extrabold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Marcar como vendido
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="bg-red-600 text-white font-extrabold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      )}

      {!isOwner && isSold && (
        <RatingForm
          sellerId={listing.sellerId}
          listingId={listing.id}
          existing={existingRating}
          onDone={(r) => setExistingRating(r)}
        />
      )}

      {showReport && (
        <ReportListingDialog
          listingId={listing.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
