import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import type { LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutSurface } from '@/components/BrutSurface';
import { MapLegend } from '@/components/MapLegend';
import type { MapLayerKey } from '@/components/MapLegend';
import { MapQuestCard } from '@/components/MapQuestCard';
import { Symbol } from '@/components/Symbol';
import { CATEGORY_META, categoryOf, shortLabel } from '@/lib/categories';
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

/**
 * `showsPointsOfInterests` wirkt nur auf Apple Maps. Auf Android blendet erst
 * dieser Stil Googles eigene Beschriftungen aus -- sonst konkurrieren sie mit
 * den eigenen Markern.
 */
const HIDE_POI_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

/**
 * Der entdeckte Marker ist hoeher als breit: Quadrat oben, Namenskaestchen
 * darunter. Der Anker muss deshalb auf die Mitte des Quadrats zeigen und nicht
 * auf die Mitte der Flaeche, sonst sitzt der Ort neben seinem Punkt.
 */
const MARKER_SIZE = 20;
const MARKER_WRAP_W = 104;
const MARKER_WRAP_H = 46;
const MARKER_ANCHOR = { x: 0.5, y: MARKER_SIZE / 2 / MARKER_WRAP_H };

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
          color: CATEGORY_META[categoryOf(a.type)].color,
          coords: [
            { latitude: a.lat, longitude: a.lon },
            { latitude: b.lat, longitude: b.lon },
          ],
        };
      })
      .filter((s): s is { key: string; color: string; coords: LatLng[] } => s !== null);
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
  // Schwenken der Karte zaeh. Das Aufploppen gehoert in den Netz-Tab.
  //
  // Ohne Nebel muss der Marker selbst den Unterschied tragen. Entdeckt heisst
  // deshalb gleichzeitig: groesser, eckig, farbig, mit Schatten und mit Namen.
  const questMarkers = useMemo(
    () =>
      PHOTO_QUESTS.map((quest) => {
        const found = done.has(quest.id);
        const color = CATEGORY_META[categoryOf(quest.type)].color;
        return (
          <Marker
            key={quest.id}
            coordinate={{ latitude: quest.lat, longitude: quest.lon }}
            anchor={found ? MARKER_ANCHOR : { x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => setSelectedQuest(quest)}
            zIndex={found ? 12 : 10}
          >
            {found ? (
              <View style={styles.foundWrap}>
                <View style={styles.foundShadow} />
                <View style={[styles.foundCore, { backgroundColor: color }]} />
                <View style={styles.foundLabel}>
                  <Text style={styles.foundLabelText} numberOfLines={1}>
                    {shortLabel(quest.title)}
                  </Text>
                </View>
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
        // Android kennt ohnehin nur Google Maps; die Zeile schreibt die Absicht
        // trotzdem hin, statt sie dem Standardwert zu ueberlassen.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={START_REGION}
        userInterfaceStyle="light"
        customMapStyle={HIDE_POI_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        showsCompass={false}
        onPress={() => setSelectedQuest(null)}
      >
        {/* Schwarze Fassung unten, Kategoriefarbe darueber -- auf heller Karte
            lesbarer als der fruehere Schein. */}
        {synapses.map((s) => (
          <Polyline
            key={`case-${s.key}`}
            coordinates={s.coords}
            strokeColor={THEME.colors.ink}
            strokeWidth={7}
            lineCap="round"
          />
        ))}
        {synapses.map((s) => (
          <Polyline
            key={s.key}
            coordinates={s.coords}
            strokeColor={s.color}
            strokeWidth={3}
            lineCap="round"
          />
        ))}

        {layers.venues ? venueMarkers : null}
        {layers.fountains ? fountainMarkers : null}
        {layers.quests ? questMarkers : null}
      </MapView>

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
          <BrutSurface radius={THEME.radius.md} contentStyle={styles.radar}>
            <View style={styles.radarIcon}>
              <Symbol name="location.north.line.fill" size={16} color={THEME.colors.ink} />
            </View>
            <View style={styles.radarText}>
              <Text style={styles.radarLabel}>NÄCHSTER ORT</Text>
              <Text style={styles.radarTitle} numberOfLines={1}>
                {nearest.quest.title}
              </Text>
            </View>
            <Text style={styles.radarDistance}>{formatDistance(nearest.distance)}</Text>
          </BrutSurface>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },

  venueDot: {
    width: 11,
    height: 11,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.surface,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
  },
  fountainDot: {
    width: 7,
    height: 7,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.ink,
    opacity: 0.45,
  },
  unknownDot: {
    width: 14,
    height: 14,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.surface,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
  },
  foundWrap: {
    width: MARKER_WRAP_W,
    height: MARKER_WRAP_H,
    alignItems: 'center',
  },
  // Der harte Versatzschatten als eigene Flaeche -- eine Schatten-Prop waere
  // auf Android weichgezeichnet.
  foundShadow: {
    position: 'absolute',
    top: THEME.shadow.offsetSm,
    left: (MARKER_WRAP_W - MARKER_SIZE) / 2 + THEME.shadow.offsetSm,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.ink,
  },
  foundCore: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
  },
  foundLabel: {
    marginTop: THEME.spacing.xs - 1,
    maxWidth: MARKER_WRAP_W,
    paddingHorizontal: THEME.spacing.xs - 1,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
  },
  foundLabelText: {
    ...THEME.type.caption,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: THEME.colors.ink,
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
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarText: { flex: 1 },
  radarLabel: { ...THEME.type.eyebrow, fontSize: 11, color: THEME.colors.textMuted },
  radarTitle: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  radarDistance: { ...THEME.type.bodyStrong, color: THEME.colors.text },
});
