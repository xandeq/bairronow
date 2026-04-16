'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { getPins, getPois, updateMapPreference } from '@/lib/api/map';
import type { MapPin, PointOfInterest, MapFilter } from '@/lib/types/map';

// Fix webpack-broken default icon paths (MAP-001 pitfall)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Vila Velha / ES default center (bairro centroid fallback)
const DEFAULT_CENTER: [number, number] = [-20.3297, -40.2927];
const DEFAULT_ZOOM = 14;

export default function MapClient() {
  const user = useAuthStore((s) => s.user);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [filter, setFilter] = useState<MapFilter>('all');
  const [showOnMap, setShowOnMap] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.bairroId) return;
    setLoading(true);
    Promise.all([
      getPins(user.bairroId, filter === 'all' ? undefined : filter),
      getPois(user.bairroId),
    ])
      .then(([p, poi]) => { setPins(p); setPois(poi); })
      .finally(() => setLoading(false));
  }, [user?.bairroId, filter]);

  const handleToggleVisibility = async () => {
    const next = !showOnMap;
    setShowOnMap(next);
    await updateMapPreference(next);
  };

  return (
    <div className="space-y-3">
      {/* MAP-004 Privacy toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'verified', 'new'] as MapFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full border ${filter === f ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {f === 'all' ? 'Todos' : f === 'verified' ? 'Verificados' : 'Novos'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={handleToggleVisibility}
            className="accent-green-700"
          />
          Aparecer no mapa
        </label>
      </div>

      {/* MAP-001 Interactive map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-[65vh] w-full rounded-xl border border-gray-200"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* MAP-003 User pins with mini-profile popup */}
        <MarkerClusterGroup chunkedLoading>
          {pins.map((pin) => (
            <Marker key={pin.userId} position={[pin.lat, pin.lng]}>
              <Popup>
                <div className="min-w-[180px] space-y-1">
                  <div className="flex items-center gap-2">
                    {pin.photoUrl ? (
                      <img
                        src={pin.photoUrl}
                        alt={pin.displayName ?? ''}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        {pin.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{pin.displayName ?? 'Vizinho'}</p>
                      {pin.isVerified && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                  {pin.bio && <p className="text-xs text-gray-500">{pin.bio}</p>}
                  <a
                    href="/marketplace"
                    className="block text-center text-xs bg-green-700 text-white py-1 px-2 rounded mt-1 hover:bg-green-800"
                  >
                    Ver perfil
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* MAP-007 POI pins */}
        {pois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.lat, poi.lng]}
            icon={L.divIcon({ className: 'poi-icon', html: `<span title="${poi.category}">📍</span>` })}
          >
            <Popup>
              <p className="font-medium text-sm">{poi.name}</p>
              <p className="text-xs text-gray-500">{poi.category}</p>
              {poi.description && <p className="text-xs text-gray-600 mt-1">{poi.description}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {loading && <p className="text-sm text-gray-500 text-center">Carregando pins...</p>}
    </div>
  );
}
