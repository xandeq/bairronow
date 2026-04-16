import React, { useEffect, useCallback } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, ScrollView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useAuthStore } from '@/lib/auth-store';
import { useMapStore } from '@/features/map/useMapStore';
import { getPins, getPois, updateMapPreference } from '@/features/map/mapApi';

// Vila Velha / ES default region
const DEFAULT_REGION = {
  latitude: -20.3297,
  longitude: -40.2927,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const FILTER_OPTIONS: Array<{ label: string; value: 'all' | 'verified' | 'new' }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Verificados', value: 'verified' },
  { label: 'Novos', value: 'new' },
];

export default function MapScreen() {
  const user = useAuthStore((s) => s.user);
  const { pins, pois, filter, showOnMap, setPins, setPois, setFilter, setShowOnMap } = useMapStore();
  const [loading, setLoading] = React.useState(true);

  const loadPins = useCallback(() => {
    if (!user?.bairroId) return;
    setLoading(true);
    Promise.all([
      getPins(user.bairroId, filter === 'all' ? undefined : filter),
      getPois(user.bairroId),
    ])
      .then(([p, poi]) => { setPins(p); setPois(poi); })
      .finally(() => setLoading(false));
  }, [user?.bairroId, filter]);

  useEffect(() => { loadPins(); }, [loadPins]);

  const handleToggleMap = async (value: boolean) => {
    setShowOnMap(value);
    await updateMapPreference(value);
  };

  return (
    <View style={styles.container}>
      {/* MAP-004 Privacy + MAP-005 Filter controls */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_OPTIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Aparecer no mapa</Text>
          <Switch
            testID="show-on-map-switch"
            value={showOnMap}
            onValueChange={handleToggleMap}
            trackColor={{ true: '#15803D' }}
          />
        </View>
      </View>

      {/* MAP-001 Interactive map */}
      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* MAP-002/003 User pins with fuzzy coordinates from backend */}
        {pins.map((pin) => (
          <Marker
            key={pin.userId}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.displayName ?? 'Vizinho'}
            pinColor={pin.isVerified ? '#15803D' : '#6B7280'}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{pin.displayName ?? 'Vizinho'}</Text>
                {pin.isVerified && (
                  <Text style={styles.verifiedBadge}>Verificado</Text>
                )}
                {pin.bio && <Text style={styles.calloutBio} numberOfLines={2}>{pin.bio}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* MAP-007 POI pins */}
        {pois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            coordinate={{ latitude: poi.lat, longitude: poi.lng }}
            title={poi.name}
            description={poi.category}
            pinColor="#3B82F6"
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#15803D" />
        </View>
      )}
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  controls: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 8 },
  filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB' },
  filterBtnActive: { backgroundColor: '#15803D', borderColor: '#15803D' },
  filterText: { fontSize: 13, color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  toggleLabel: { fontSize: 13, color: '#374151' },
  map: { flex: 1, width: '100%' },
  callout: { minWidth: 160, padding: 4 },
  calloutName: { fontWeight: '600', fontSize: 14, color: '#111827' },
  verifiedBadge: { fontSize: 11, color: '#15803D', fontWeight: '500', marginTop: 2 },
  calloutBio: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
});
