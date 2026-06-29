import type { Metadata } from "next";
import ListingPreviewClient from "./ListingPreviewClient";

export const metadata: Metadata = {
  title: "Meu Vizinho - Oferta do Bairro",
  openGraph: {
    title: "Meu Vizinho - Veja esta oferta entre vizinhos",
    description: "Compre e venda entre vizinhos verificados.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export function generateStaticParams() {
  return [{ listingId: "preview" }];
}

export default async function ListingPreviewPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return <ListingPreviewClient listingId={listingId} />;
}
