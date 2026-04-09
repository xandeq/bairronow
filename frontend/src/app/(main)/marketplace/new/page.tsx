"use client";

import { useRouter } from "next/navigation";
import ListingForm from "@/components/features/marketplace/ListingForm";
import { useAuthStore } from "@/lib/auth";
import { createListing } from "@/lib/api/marketplace";

export default function NewListingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user?.isVerified) {
    return (
      <div className="bg-bg border-2 border-amber-400 rounded-lg p-6 space-y-3">
        <h1 className="text-2xl font-extrabold text-fg">
          Verificação necessária
        </h1>
        <p className="text-fg/70 font-medium">
          Apenas vizinhos verificados podem criar anúncios.
        </p>
        <button
          type="button"
          onClick={() => router.push("/profile/")}
          className="bg-primary text-white font-extrabold px-4 py-2 rounded-lg"
        >
          Verificar meu endereço
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-fg">Novo anúncio</h1>
      <ListingForm
        mode="create"
        onSubmit={async (values) => {
          const created = await createListing({
            title: values.title,
            description: values.description,
            price: values.price,
            categoryCode: values.categoryCode,
            subcategoryCode: values.subcategoryCode,
            photos: values.photos,
          });
          router.push(`/marketplace/${created.id}/`);
        }}
      />
    </div>
  );
}
