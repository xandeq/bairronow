import React, { useEffect, useCallback } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useAuthStore } from '../../src/lib/auth-store';
import { useMapStore } from '../../src/features/map/useMapStore';
import { getPins, getPois, updateMapPreference } from '../../src/features/map/mapApi';
import { useTheme } from '../../src/theme/ThemeContext';

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
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.controls, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_OPTIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filterBtn,
                { borderColor: colors.border },
                filter === value && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.filterText, { color: colors.mutedFg }, filter === value && { color: '#fff' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: colors.fg }]}>Aparecer no mapa</Text>
          <Switch
            testID="show-on-map-switch"
            value={showOnMap}
            onValueChange={handleToggleMap}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.userId}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.displayName ?? 'Vizinho'}
            pinColor={pin.isVerified ? colors.secondary : colors.mutedFg}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{pin.displayName ?? 'Vizinho'}</Text>
                {pin.isVerified && (
                  <Text style={[styles.verifiedBadge, { color: colors.secondary }]}>Verificado</Text>
                )}
                {pin.bio && <Text style={styles.calloutBio} numberOfLines={2}>{pin.bio}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}

        {pois.map((poi) => (
          <Marker
            key={`poi-${poi.id}`}
            coordinate={{ latitude: poi.lat, longitude: poi.lng }}
            title={poi.name}
            description={poi.category}
            pinColor={colors.primary}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { borderBottomWidth: 1, paddingVertical: 8 },
  filterRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  toggleLabel: { fontSize: 13 },
  map: { flex: 1, width: '100%' },
  callout: { minWidth: 160, padding: 4 },
  calloutName: { fontWeight: '600', fontSize: 14, color: '#111827' },
  verifiedBadge: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  calloutBio: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
});
