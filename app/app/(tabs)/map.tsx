import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import type { LatLng, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/GlassSurface';
import { MapLegend } from '@/components/MapLegend';
import type { MapLayerKey } from '@/components/MapLegend';
import { MapQuestCard } from '@/components/MapQuestCard';
import { Symbol } from '@/components/Symbol';
import placesData from '@/data/places.json';
import { EDGES, formatDistance, meters } from '@/lib/net';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

const { venues, fountains } = placesData;

/**
 * Bounding Box aus Festival-Spielorten + allen Foto-Quests (nicht Brunnen --
 * die streuen ueber ganz Linz und wuerden die Startansicht zu weit rauszoomen).
 */
function computeStartRegion(): Region {
  const points = [
    ...venues.map((v) => ({ lat: v.lat, lon: v.lon })),
    ...PHOTO_QUESTS.map((q) => ({ lat: q.lat, lon: q.lon })),
  ];
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = Math.max(maxLat - minLat, 0.001);
  const lonSpan = Math.max(maxLon - minLon, 0.001);
  const PADDING_FACTOR = 0.4;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(latSpan * (1 + PADDING_FACTOR * 2), 0.025),
    longitudeDelta: Math.max(lonSpan * (1 + PADDING_FACTOR * 2), 0.025),
  };
}

const START_REGION = computeStartRegion();

/** Grosszuegig ueber den ganzen Grossraum Linz, damit der Nebel nie endet. */
const FOG_OUTER: LatLng[] = [
  { latitude: 48.42, longitude: 14.12 },
  { latitude: 48.42, longitude: 14.48 },
  { latitude: 48.18, longitude: 14.48 },
  { latitude: 48.18, longitude: 14.12 },
];

const CLEAR_RADIUS_M = 190;
const CLEAR_SEGMENTS = 24;

/**
 * Ein Loch im Nebel um einen entdeckten Ort.
 *
 * Die Punkte laufen gegen den Uhrzeigersinn, waehrend FOG_OUTER im
 * Uhrzeigersinn liegt: MapKit erwartet Loecher in umgekehrter
 * Windungsrichtung zur Aussenkontur, sonst bleibt die Flaeche komplett
 * schwarz statt aufzureissen.
 */
function clearing(lat: number, lon: number): LatLng[] {
  const dLat = CLEAR_RADIUS_M / 111320;
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  return Array.from({ length: CLEAR_SEGMENTS }, (_, i) => {
    const a = -(i / CLEAR_SEGMENTS) * 2 * Math.PI;
    return {
      latitude: lat + Math.sin(a) * dLat,
      longitude: lon + Math.cos(a) * dLon,
    };
  });
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completedQuestIds, requestSegment } = useGameStore();

  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>({
    quests: true,
    venues: true,
    fountains: false,
  });
  const [selectedQuest, setSelectedQuest] = useState<PhotoQuest | null>(null);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  // Naehe-Radar. Ohne Freigabe passiert schlicht nichts -- die Leiste bleibt weg,
  // statt eine Fehlermeldung ueber die Karte zu legen.
  useEffect(() => {
    let stop: Location.LocationSubscription | undefined;
    let alive = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive || status !== 'granted') return;
      stop = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15 },
        ({ coords }) => setPosition({ lat: coords.latitude, lon: coords.longitude }),
      );
    })().catch(() => undefined);

    return () => {
      alive = false;
      stop?.remove();
    };
  }, []);

  const toggleLayer = (key: MapLayerKey) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };

  const done = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);

  const fogHoles = useMemo(
    () => PHOTO_QUESTS.filter((q) => done.has(q.id)).map((q) => clearing(q.lat, q.lon)),
    [done],
  );

  /** Nur Kanten, deren beide Enden entdeckt sind, spannen sich ueber die Stadt. */
  const synapses = useMemo(() => {
    const at = new Map(PHOTO_QUESTS.map((q) => [q.id, q]));
    return EDGES.filter((e) => done.has(e.a) && done.has(e.b))
      .map((e) => {
        const a = at.get(e.a);
        const b = at.get(e.b);
        if (!a || !b) return null;
        return {
          key: `${e.a}-${e.b}`,
          coords: [
            { latitude: a.lat, longitude: a.lon },
            { latitude: b.lat, longitude: b.lon },
          ],
        };
      })
      .filter((s): s is { key: string; coords: LatLng[] } => s !== null);
  }, [done]);

  /** Der naechste noch unentdeckte Ort -- die eine Zahl, die das Radar braucht. */
  const nearest = useMemo(() => {
    if (!position) return null;
    let best: { quest: PhotoQuest; distance: number } | null = null;
    for (const quest of PHOTO_QUESTS) {
      if (done.has(quest.id)) continue;
      const d = meters(position.lat, position.lon, quest.lat, quest.lon);
      if (!best || d < best.distance) best = { quest, distance: d };
    }
    return best;
  }, [position, done]);

  const venueMarkers = useMemo(
    () =>
      venues.map((venue, index) => (
        <Marker
          key={`venue-${venue.id}-${index}`}
          coordinate={{ latitude: venue.lat, longitude: venue.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1}
        >
          <View style={styles.venueDot} />
        </Marker>
      )),
    [],
  );

  const fountainMarkers = useMemo(
    () =>
      fountains.map((fountain, index) => (
        <Marker
          key={`fountain-${fountain.id}-${index}`}
          coordinate={{ latitude: fountain.lat, longitude: fountain.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1}
        >
          <View style={styles.fountainDot} />
        </Marker>
      )),
    [],
  );

  // Marker bleiben bewusst statisch: eine laufende Animation zwingt
  // tracksViewChanges auf true, und 23 sich neu zeichnende Marker machen das
  // Schwenken der Karte zaeh. Das Pulsieren gehoert in den Netz-Tab.
  const questMarkers = useMemo(
    () =>
      PHOTO_QUESTS.map((quest) => {
        const found = done.has(quest.id);
        return (
          <Marker
            key={quest.id}
            coordinate={{ latitude: quest.lat, longitude: quest.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => setSelectedQuest(quest)}
            zIndex={found ? 12 : 10}
          >
            {found ? (
              <View style={styles.foundWrap}>
                <View style={styles.foundHalo} />
                <View style={styles.foundCore} />
              </View>
            ) : (
              <View style={styles.unknownDot} />
            )}
          </Marker>
        );
      }),
    [done],
  );

  const handleNavigateToQuest = () => {
    requestSegment('photo');
    setSelectedQuest(null);
    router.push('/(tabs)/quests');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={START_REGION}
        userInterfaceStyle="dark"
        showsUserLocation
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsCompass={false}
        onPress={() => setSelectedQuest(null)}
      >
        <Polygon
          coordinates={FOG_OUTER}
          holes={fogHoles.length ? fogHoles : undefined}
          fillColor={THEME.colors.fog}
          strokeWidth={0}
          tappable={false}
        />

        {synapses.map((s) => (
          <Polyline
            key={`glow-${s.key}`}
            coordinates={s.coords}
            strokeColor={THEME.colors.primaryGlow}
            strokeWidth={7}
            lineCap="round"
          />
        ))}
        {synapses.map((s) => (
          <Polyline
            key={s.key}
            coordinates={s.coords}
            strokeColor={THEME.colors.primary}
            strokeWidth={1.5}
            lineCap="round"
          />
        ))}

        {layers.venues ? venueMarkers : null}
        {layers.fountains ? fountainMarkers : null}
        {layers.quests ? questMarkers : null}
      </MapView>

      {/* Vignette: nimmt der Karte die Kanten und traegt die Glaselemente. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        style={styles.vignetteTop}
        pointerEvents="none"
      />

      <MapLegend
        layers={layers}
        onToggle={toggleLayer}
        topOffset={insets.top + THEME.spacing.sm}
      />

      <View style={styles.bottom} pointerEvents="box-none">
        {selectedQuest ? (
          <MapQuestCard
            quest={selectedQuest}
            completed={done.has(selectedQuest.id)}
            onNavigate={handleNavigateToQuest}
            onClose={() => setSelectedQuest(null)}
          />
        ) : nearest ? (
          <GlassSurface radius={THEME.radius.lg} contentStyle={styles.radar}>
            <View style={styles.radarIcon}>
              <Symbol name="location.north.line.fill" size={16} color={THEME.colors.primary} />
            </View>
            <View style={styles.radarText}>
              <Text style={styles.radarLabel}>NÄCHSTER ORT</Text>
              <Text style={styles.radarTitle} numberOfLines={1}>
                {nearest.quest.title}
              </Text>
            </View>
            <Text style={styles.radarDistance}>{formatDistance(nearest.distance)}</Text>
          </GlassSurface>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  vignetteTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },

  venueDot: {
    width: 10,
    height: 10,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.tileRaised,
    borderWidth: 1.5,
    borderColor: THEME.colors.textMuted,
  },
  fountainDot: {
    width: 7,
    height: 7,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.textMuted,
    opacity: 0.6,
  },
  unknownDot: {
    width: 12,
    height: 12,
    borderRadius: THEME.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.textMuted,
    opacity: 0.75,
  },
  foundWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  foundHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
    borderWidth: 1,
    borderColor: THEME.colors.primaryGlow,
  },
  foundCore: {
    width: 14,
    height: 14,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  bottom: {
    position: 'absolute',
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    bottom: THEME.tabBarClearance,
  },
  radar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.sm,
  },
  radarIcon: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarText: { flex: 1 },
  radarLabel: { ...THEME.type.eyebrow, fontSize: 11, color: THEME.colors.textFaint },
  radarTitle: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  radarDistance: { ...THEME.type.bodyStrong, color: THEME.colors.primary },
});
