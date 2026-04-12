import ListingDetailClient from "./ListingDetailClient";

// Next.js static export requires at least one pre-rendered route for dynamic segments.
// We provide a placeholder slug "0" — the actual listing is resolved client-side
// via useParams() and authenticated API calls.
export async function generateStaticParams() {
  return [{ id: "0" }];
}

export const dynamicParams = false;

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
