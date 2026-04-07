import Card from "@/components/ui/Card";
import type { Listing } from "@bairronow/shared-types";

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card interactive padding="sm">
      <div className="aspect-square w-full bg-muted rounded-md mb-3 flex items-center justify-center text-fg/40 font-bold">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          "Sem imagem"
        )}
      </div>
      <h3 className="font-bold text-fg truncate">{listing.title}</h3>
      <p className="text-primary font-extrabold text-lg">
        {formatBRL(listing.price)}
      </p>
      <p className="text-xs text-fg/60 font-medium truncate">
        {listing.seller.name} • {listing.seller.bairro}
      </p>
    </Card>
  );
}
