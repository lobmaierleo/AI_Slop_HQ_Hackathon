import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapLegend } from '@/components/MapLegend';
import type { MapLayerKey } from '@/components/MapLegend';
import { MapQuestCard } from '@/components/MapQuestCard';
import placesData from '@/data/places.json';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

const { venues, fountains } = placesData;

/**
 * Bounding Box aus Festival-Spielorten + allen Foto-Quests (nicht Brunnen —
 * die streuen über ganz Linz und würden die Startansicht zu weit rauszoomen).
 * Mit Rand-Puffer, damit kein Marker am Bildrand klebt.
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
 * Gleiche Zuordnung wie in PhotoQuestCard: Akzent fuer Wasser, Gruen fuer
 * Baeume, alles Weitere neutral. Bei 21 Pins ist das der einzige Weg, die
 * Karte ohne zusaetzliche Markenfarben lesbar zu halten.
 */
const PIN_COLOR: Record<string, string> = {
  water: THEME.colors.primary,
  tree: THEME.colors.success,
};

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completedQuestIds, requestSegment } = useGameStore();

  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>({
    quests: true,
    venues: true,
    fountains: true,
  });
  const [selectedQuest, setSelectedQuest] = useState<PhotoQuest | null>(null);

  const toggleLayer = (key: MapLayerKey) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };

  // Statische Hintergrund-Ebenen: einmal berechnet, nie neu — ids kollidieren
  // teils im Spielort-Export, daher Index im Key für garantierte Eindeutigkeit.
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

  // Hängt von completedQuestIds ab, damit erledigte Quests sichtbar abgesetzt werden.
  const questMarkers = useMemo(
    () =>
      PHOTO_QUESTS.map((quest) => {
        const done = completedQuestIds.includes(quest.id);
        return (
          <Marker
            key={quest.id}
            coordinate={{ latitude: quest.lat, longitude: quest.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            stopPropagation
            zIndex={10}
            onPress={() => setSelectedQuest(quest)}
          >
            <View
              style={[
                styles.questPin,
                { backgroundColor: PIN_COLOR[quest.type] ?? THEME.colors.text },
                done ? styles.questPinDone : null,
              ]}
            >
              <Text style={[styles.questEmoji, done ? styles.questEmojiDone : null]}>
                {quest.emoji}
              </Text>
              {done ? (
                <View style={styles.questCheck}>
                  <Text style={styles.questCheckText}>✓</Text>
                </View>
              ) : null}
            </View>
          </Marker>
        );
      }),
    [completedQuestIds],
  );

  const handleNavigateToQuest = () => {
    requestSegment('photo');
    router.push('/(tabs)/quests');
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={START_REGION}
        onPress={() => setSelectedQuest(null)}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {layers.venues ? venueMarkers : null}
        {layers.fountains ? fountainMarkers : null}
        {layers.quests ? questMarkers : null}
      </MapView>

      <MapLegend
        layers={layers}
        onToggle={toggleLayer}
        topOffset={insets.top + THEME.spacing.sm}
      />

      {selectedQuest ? (
        <View style={styles.cardWrap} pointerEvents="box-none">
          <MapQuestCard
            quest={selectedQuest}
            completed={completedQuestIds.includes(selectedQuest.id)}
            onNavigate={handleNavigateToQuest}
            onClose={() => setSelectedQuest(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  venueDot: {
    width: 10,
    height: 10,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.card,
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
  questPin: {
    width: 46,
    height: 46,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.card,
  },
  questPinDone: {
    backgroundColor: THEME.colors.track,
    borderColor: THEME.colors.card,
    opacity: 0.55,
  },
  questEmoji: {
    fontSize: 21,
  },
  questEmojiDone: {
    opacity: 0.7,
  },
  questCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.card,
  },
  questCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.onAccent,
  },
  cardWrap: {
    position: 'absolute',
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    bottom: THEME.tabBarClearance,
  },
});
