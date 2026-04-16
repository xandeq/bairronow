import { create } from 'zustand';
import type { MapPin, PoiPin } from './mapApi';

interface MapStore {
  pins: MapPin[];
  pois: PoiPin[];
  filter: 'all' | 'verified' | 'new';
  showOnMap: boolean;
  setPins: (pins: MapPin[]) => void;
  setPois: (pois: PoiPin[]) => void;
  setFilter: (f: 'all' | 'verified' | 'new') => void;
  setShowOnMap: (v: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pins: [],
  pois: [],
  filter: 'all',
  showOnMap: true,
  setPins: (pins) => set({ pins }),
  setPois: (pois) => set({ pois }),
  setFilter: (filter) => set({ filter }),
  setShowOnMap: (showOnMap) => set({ showOnMap }),
}));
