import type { Metadata } from "next";
import ListingPreviewClient from "./ListingPreviewClient";

export const metadata: Metadata = {
  title: "BairroNow - Oferta do Bairro",
  openGraph: {
    title: "BairroNow - Veja esta oferta no BairroNow",
    description: "Compre e venda entre vizinhos verificados.",
    images: [
      {
        url: "https://bairronow.com.br/og-default.png",
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
