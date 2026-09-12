import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutButton } from '@/components/BrutButton';
import { BrutSurface } from '@/components/BrutSurface';
import { MapFilterBar } from '@/components/MapFilterBar';
import { QuestDetailSheet } from '@/components/QuestDetailSheet';
import { Symbol } from '@/components/Symbol';
import { CATEGORY_KEYS, CATEGORY_META, categoryOf, shapePoints, shortLabel } from '@/lib/categories';
import type { NodeShape } from '@/lib/categories';
import placesData from '@/data/places.json';
import { formatDistance, meters } from '@/lib/net';
import { useUserLocation } from '@/lib/useUserLocation';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';
import type { CategoryKey } from '@/theme/colors';

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

/* --- TEMPORAERE DIAGNOSE (wieder entfernen, sobald die Ursache steht) ---
 *
 * Drei Fragen, die ein einziger Pinch beantwortet:
 *  1. render  -- rendert die `MapView` waehrend der Geste neu?
 *  2. start   -- kommt die Geste ueberhaupt als Geste an (`isGesture`)?
 *  3. done    -- steht der `longitudeDelta` danach kleiner, oder springt er
 *                auf den Ausgangswert zurueck?
 * Die Rueckrufe stehen auf Modulebene, damit sie stabil sind und die
 * `memo`-Kette um `MapCanvas` nicht selbst aufbrechen.
 */
let canvasRenders = 0;
const logRegion = (tag: string) => (region: Region, details: { isGesture?: boolean }) => {
  console.log(
    `[zoom] ${tag} isGesture=${details.isGesture} lonDelta=${region.longitudeDelta.toFixed(6)}`,
  );
};
const onRegionStart = logRegion('start');
const onRegionDone = logRegion('done ');

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
 * Formgroessen der Marker. Unentdeckt ist die Form klein, weiss und ohne
 * Schatten -- entdeckt wird sie groesser, farbig, bekommt einen
 * Versatzschatten und ein Namenskaestchen darunter.
 */
const UNDISCOVERED_SIZE = 16;
const UNDISCOVERED_R = 5;
const DISCOVERED_SIZE = 26;
const DISCOVERED_R = 9;
const UNDISCOVERED_ANCHOR = { x: 0.5, y: 0.5 };

/**
 * Der entdeckte Marker ist hoeher als breit: Form oben, Namenskaestchen
 * darunter. Der Anker muss deshalb auf die Mitte der Form zeigen und nicht
 * auf die Mitte der Flaeche, sonst sitzt der Ort neben seinem Punkt.
 */
const MARKER_WRAP_W = 104;
const SHAPE_BOX = DISCOVERED_SIZE + THEME.shadow.offsetSm;
const MARKER_WRAP_H = SHAPE_BOX + (THEME.spacing.xs - 1) + 21;
const MARKER_ANCHOR = { x: 0.5, y: DISCOVERED_SIZE / 2 / MARKER_WRAP_H };

/** Kategorieform als SVG, zentriert im Quadrat `size` x `size`. */
function CategoryGlyph({
  shape,
  size,
  r,
  fill,
}: {
  shape: NodeShape;
  size: number;
  r: number;
  fill: string;
}) {
  const c = size / 2;
  const stroke = THEME.border.color;
  const strokeWidth = THEME.border.width;
  return (
    <Svg width={size} height={size}>
      {shape === 'circle' ? (
        <Circle cx={c} cy={c} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      ) : (
        <Polygon
          points={shapePoints(shape, c, c, r)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
    </Svg>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { completedQuestIds } = useGameStore();

  const [active, setActive] = useState<Record<CategoryKey, boolean>>(() => {
    const all = {} as Record<CategoryKey, boolean>;
    CATEGORY_KEYS.forEach((key) => {
      all[key] = true;
    });
    return all;
  });
  const [openQuest, setOpenQuest] = useState<PhotoQuest | null>(null);
  // Imperativer Zugriff auf die Karte: `animateToRegion` laeuft am Ref vorbei
  // an React und loest keinen Neurender der Marker aus.
  const mapRef = useRef<MapView | null>(null);

  const toggleCategory = (key: CategoryKey) => {
    setActive((current) => ({ ...current, [key]: !current[key] }));
  };

  const done = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);

  // Stabile Rueckrufe: jede neue Funktionsreferenz waere fuer `MapCanvas` eine
  // Aenderung und wuerde die Karte samt Markern neu zeichnen.
  const handleSelect = useCallback((quest: PhotoQuest) => setOpenQuest(quest), []);
  const handleBackground = useCallback(() => setOpenQuest(null), []);
  // Nach dem Hineinzoomen fuehrt ein Tipp zurueck zur ganzen Stadt -- das
  // Gegenstueck zum Doppeltipp im Netz.
  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion(START_REGION, 450);
  }, []);

  return (
    <View style={styles.container}>
      <MapCanvas
        mapRef={mapRef}
        active={active}
        done={done}
        onSelect={handleSelect}
        onBackground={handleBackground}
      />

      <MapFilterBar
        active={active}
        onToggle={toggleCategory}
        topOffset={insets.top + THEME.spacing.sm}
      />

      <NearestBar done={done} onRecenter={handleRecenter} />

      {/* Erst einhaengen, wenn wirklich eine Quest offen ist: das Sheet haelt
          Kamera- und Standortzugriff, und drei schlafende Instanzen in drei
          Tabs fragen beides dreimal gleichzeitig an. */}
      {openQuest ? (
        <QuestDetailSheet quest={openQuest} onClose={() => setOpenQuest(null)} />
      ) : null}
    </View>
  );
}

/**
 * Die Karte selbst, abgeschirmt gegen alles, was sie nichts angeht.
 *
 * Jeder Neurender der `MapView` bricht auf iOS eine laufende Pinch-Geste ab --
 * und der Kartenschirm rendert oft: Sheet auf, Sheet zu, Fortschritt gespeichert,
 * Standort gewandert. `memo` laesst davon nur noch durch, was die Karte
 * tatsaechlich veraendert: Filter und Entdeckungsstand.
 */
const MapCanvas = memo(function MapCanvas({
  mapRef,
  active,
  done,
  onSelect,
  onBackground,
}: {
  mapRef: React.RefObject<MapView | null>;
  active: Record<CategoryKey, boolean>;
  done: Set<string>;
  onSelect: (quest: PhotoQuest) => void;
  onBackground: () => void;
}) {
  // TEMPORAERE DIAGNOSE
  canvasRenders += 1;
  console.log(`[zoom] render #${canvasRenders}`);

  // Kontextschicht: eine aktive Kategorie zeigt nicht nur ihre Quests, sondern
  // den ganzen Linzer Datensatz dahinter. Fuer `tree`, `art` und `history` gibt
  // es in data/places.json keine solche Schicht -- dort erscheinen nur die
  // Quests, das ist so vorgesehen.
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
  // Abweichung von der Regel in CLAUDE.md, die fuer unentdeckt "einen kleinen
  // weissen Kreis" vorschreibt: die Kategorieform traegt die Art jetzt auch im
  // unentdeckten Zustand. Groesse, Fuellung, Schatten und Name bleiben allein
  // beim Entdeckungszustand -- Ohne Nebel muss der Marker den Unterschied
  // tragen, deshalb heisst entdeckt weiterhin: groesser, farbig, mit Schatten
  // und mit Namen.
  const questMarkers = useMemo(
    () =>
      PHOTO_QUESTS.filter((quest) => active[categoryOf(quest.type)]).map((quest) => {
        const found = done.has(quest.id);
        const meta = CATEGORY_META[categoryOf(quest.type)];
        return (
          <Marker
            key={quest.id}
            coordinate={{ latitude: quest.lat, longitude: quest.lon }}
            anchor={found ? MARKER_ANCHOR : UNDISCOVERED_ANCHOR}
            tracksViewChanges={false}
            onPress={() => onSelect(quest)}
            zIndex={found ? 12 : 10}
          >
            {found ? (
              <View style={styles.foundWrap}>
                <View style={styles.foundShapeBox}>
                  <View style={styles.foundShadowSlot}>
                    <CategoryGlyph
                      shape={meta.shape}
                      size={DISCOVERED_SIZE}
                      r={DISCOVERED_R}
                      fill={THEME.colors.ink}
                    />
                  </View>
                  <View style={styles.foundCoreSlot}>
                    <CategoryGlyph
                      shape={meta.shape}
                      size={DISCOVERED_SIZE}
                      r={DISCOVERED_R}
                      fill={meta.color}
                    />
                  </View>
                </View>
                <View style={styles.foundLabel}>
                  <Text style={styles.foundLabelText} numberOfLines={1}>
                    {shortLabel(quest.title)}
                  </Text>
                </View>
              </View>
            ) : (
              <CategoryGlyph
                shape={meta.shape}
                size={UNDISCOVERED_SIZE}
                r={UNDISCOVERED_R}
                fill={THEME.colors.surface}
              />
            )}
          </Marker>
        );
      }),
    [done, active],
  );

  return (
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
      // Die vier Gesten stehen ausgeschrieben da, statt sich auf Standardwerte
      // zu verlassen: Zoom und Schwenk sind die Karte, Drehen und Neigen
      // bringen auf einem Stadtplan nur verrutschte Ansichten.
      zoomEnabled
      scrollEnabled
      zoomTapEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={onBackground}
      onRegionChangeStart={onRegionStart}
      onRegionChangeComplete={onRegionDone}
    >
      {active.water ? fountainMarkers : null}
      {active.venue ? venueMarkers : null}
      {questMarkers}
    </MapView>
  );
});

/**
 * Die Naehe-Leiste holt sich den Standort selbst.
 *
 * Nur so bleibt die Karte darueber beim Gehen unberuehrt: ein Standortwechsel
 * rendert dann diese Leiste neu und nicht den ganzen Screen -- ein Neurender
 * der `MapView` bricht auf iOS jede laufende Zoom-Geste ab.
 */
function NearestBar({ done, onRecenter }: { done: Set<string>; onRecenter: () => void }) {
  const position = useUserLocation();

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

  return (
    <View style={styles.bottom} pointerEvents="box-none">
      <View style={styles.recenterRow} pointerEvents="box-none">
        <BrutButton
          label="Alle Orte"
          icon="arrow.up.left.and.arrow.down.right"
          size="sm"
          shadow="sm"
          haptic="light"
          onPress={onRecenter}
          accessibilityLabel="Karte auf alle Orte zuruecksetzen"
        />
      </View>
      {nearest ? (
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
  foundWrap: {
    width: MARKER_WRAP_W,
    height: MARKER_WRAP_H,
    alignItems: 'center',
  },
  foundShapeBox: {
    width: SHAPE_BOX,
    height: SHAPE_BOX,
  },
  // Der harte Versatzschatten als eigene Flaeche -- eine Schatten-Prop waere
  // auf Android weichgezeichnet.
  foundShadowSlot: {
    position: 'absolute',
    top: THEME.shadow.offsetSm,
    left: THEME.shadow.offsetSm,
  },
  foundCoreSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    gap: THEME.spacing.sm,
  },
  // Rechts, wo der Daumen der haltenden Hand ohnehin liegt.
  recenterRow: {
    alignItems: 'flex-end',
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
