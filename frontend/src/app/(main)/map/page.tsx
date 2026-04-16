import MapLoader from './MapLoader';

export default function MapPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-fg mb-4">Mapa do Bairro</h1>
      <MapLoader />
    </main>
  );
}
