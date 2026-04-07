import ListingCard from "@/components/features/marketplace/ListingCard";
import type { Listing } from "@bairronow/shared-types";

const stubListings: Listing[] = [
  {
    id: "l1",
    title: "Bicicleta aro 26 seminova",
    price: 450,
    seller: { id: "s1", name: "Ana", bairro: "Itapoã", verified: true },
  },
  {
    id: "l2",
    title: "Sofá 3 lugares cinza",
    price: 800,
    seller: { id: "s2", name: "Roberto", bairro: "Centro", verified: true },
  },
  {
    id: "l3",
    title: "Mesa de jantar 6 lugares",
    price: 1200,
    seller: { id: "s3", name: "Júlia", bairro: "Praia da Costa", verified: true },
  },
  {
    id: "l4",
    title: "Bolos caseiros sob encomenda",
    price: 60,
    seller: { id: "s4", name: "Dona Maria", bairro: "Centro", verified: true },
  },
];

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-fg">Marketplace</h1>
        <p className="text-fg/60 font-medium">
          Compre e venda no seu bairro
        </p>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stubListings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
