'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), {
  loading: () => <div className="h-[70vh] bg-muted animate-pulse rounded-lg" />,
  ssr: false,
});

export default function MapLoader() {
  return <MapClient />;
}
