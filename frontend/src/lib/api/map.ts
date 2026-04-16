import api from '@/lib/api';
import type { MapPin, PointOfInterest, HeatmapCell } from '@/lib/types/map';

export async function getPins(bairroId: number, filter?: string): Promise<MapPin[]> {
  const { data } = await api.get<MapPin[]>('/api/v1/map/pins', { params: { bairroId, filter } });
  return data;
}

export async function getPois(bairroId: number): Promise<PointOfInterest[]> {
  const { data } = await api.get<PointOfInterest[]>('/api/v1/map/pois', { params: { bairroId } });
  return data;
}

export async function getHeatmap(bairroId: number): Promise<HeatmapCell[]> {
  const { data } = await api.get<HeatmapCell[]>('/api/v1/map/heatmap', { params: { bairroId } });
  return data;
}

export async function updateMapPreference(showOnMap: boolean): Promise<void> {
  await api.put('/api/v1/map/preference', { showOnMap });
}
