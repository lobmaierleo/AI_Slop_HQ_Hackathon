import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { openSettings } from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutButton } from '@/components/BrutButton';
import { BrutSurface } from '@/components/BrutSurface';
import { FactOrSlopCard } from '@/components/FactOrSlopCard';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import { CATEGORY_META, categoryOf } from '@/lib/categories';
import { openDirections } from '@/lib/directions';
import { formatDistance, meters } from '@/lib/net';
import { savePhoto } from '@/lib/photoStore';
import { useUserLocation } from '@/lib/useUserLocation';
import { TRIVIA_QUESTS, triviaFor, useGameStore } from '@/state/useGameStore';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

type Props = { quest: PhotoQuest | null; onClose: () => void };

const MAP_DELTA = 0.004;

/** Wie in app/(tabs)/map.tsx -- Android zeigt sonst Googles eigene POI-Labels neben dem eigenen Marker. */
const HIDE_POI_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

/** Deutsches Dezimalkomma, immer mit einer Nachkommastelle: 6.4 -> "6,4 L". */
function formatLiters(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} L`;
}

export function QuestDetailSheet({ quest, onClose }: Props) {
  const { completedQuestIds, completedPhotos, answeredTriviaIds, completePhotoQuest } =
    useGameStore();
  const [cameraOpen, setCameraOpen] = useState(false);
  /**
   * `takePictureAsync` wirft, solange die Kamera nicht fertig hochgefahren ist.
   * Frueher schloss der Fehlerzweig einfach die Kamera -- man tippte dann
   * mehrfach, bis das Geraet zufaellig schnell genug war. Deshalb wird der
   * Ausloeser hier bis `onCameraReady` gesperrt.
   */
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Jeder Fehlschlag bekommt einen sichtbaren Satz. Stiller Abbruch wirkt wie ein toter Knopf. */
  const [problem, setProblem] = useState<string | null>(null);
  /** Gesperrter Zugriff ist kein Fehler, sondern ein Weg -- er fuehrt in die Einstellungen. */
  const [blocked, setBlocked] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const position = useUserLocation();
  /** Schlaegt das Laden des Beweisfotos fehl, zeigt sich das erst nach dem Rendern -- Hook bleibt fuer jede Quest frisch. */
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [quest?.id]);

  if (!quest) return null;

  const done = completedQuestIds.includes(quest.id);
  const photoUri = completedPhotos[quest.id];
  const trivia = triviaFor(quest);
  const color = CATEGORY_META[categoryOf(quest.type)].color;
  const distanceLabel = position
    ? formatDistance(meters(position.lat, position.lon, quest.lat, quest.lon))
    : null;

  const closeCamera = () => {
    setCameraOpen(false);
    setCameraReady(false);
    setBusy(false);
  };

  const handleClose = () => {
    closeCamera();
    setProblem(null);
    setBlocked(false);
    onClose();
  };

  const handleOpenCamera = async () => {
    setProblem(null);
    setBlocked(false);

    // Kein Hook-Zustand, sondern der Stand direkt beim Modul: das Sheet haengt
    // in mehreren Screens, und ein zwischengespeicherter Status waere dort
    // jeweils ein eigener, der die Freigabe des anderen nicht mitbekommt.
    const current = await Camera.getCameraPermissionsAsync().catch(() => null);
    if (!current) {
      setProblem('Die Kamera fehlt in dieser Version der App. Installier den aktuellen Build neu.');
      return;
    }

    // iOS zeigt den Systemdialog genau einmal pro Installation. Danach ist
    // `canAskAgain` false und das Fragen selbst waere ein stiller Fehlschlag --
    // deshalb erst pruefen, dann fragen.
    const result = !current.granted && current.canAskAgain
      ? ((await Camera.requestCameraPermissionsAsync().catch(() => null)) ?? current)
      : current;

    if (!result.granted) {
      setBlocked(!result.canAskAgain);
      setProblem(
        result.canAskAgain
          ? 'Ohne Kamerazugriff geht es nicht. Tippe erneut und erlaube den Zugriff.'
          : 'iOS hat den Kamerazugriff für SELBERDENKEN gesperrt. Gib ihn in den Einstellungen frei — oder bestätige unten ohne Foto.',
      );
      return;
    }

    setCameraReady(false);
    setCameraOpen(true);
  };

  const handleShutter = async () => {
    if (!cameraReady || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.5, skipProcessing: true });
      if (!photo?.uri) throw new Error('kein Bild');
      // Cache-URI von expo-camera raeumt iOS irgendwann weg -- dauerhaft ablegen.
      // Schlaegt das fehl, soll die Quest trotzdem gelingen: Cache-URI als Rueckfall.
      let uri = photo.uri;
      try {
        uri = await savePhoto(quest.id, photo.uri);
      } catch {
        // Bleibt bei der Cache-URI.
      }
      completePhotoQuest(quest.id, uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      closeCamera();
    } catch {
      // Die Kamera bleibt offen: ein zweiter Versuch soll einen Tipp kosten,
      // nicht den ganzen Weg zurueck durch das Menue.
      setBusy(false);
      setProblem('Das Bild ist nicht zustande gekommen. Versuch es gleich noch einmal.');
    }
  };

  const handleFallbackConfirm = () => {
    setProblem(null);
    closeCamera();
    completePhotoQuest(quest.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Kopf */}
          <View style={styles.headerRow}>
            <View style={[styles.symbolBadge, { backgroundColor: done ? THEME.colors.success : THEME.colors.primary }]}>
              <Symbol name={quest.symbol} size={24} color={THEME.colors.ink} />
            </View>
            <View style={styles.headerText}>
              <View style={styles.badgeBox}>
                <Text style={styles.badgeText}>{quest.badge}</Text>
              </View>
              <Text style={styles.title}>{quest.title}</Text>
              <Text style={styles.location}>{quest.location}</Text>
              {distanceLabel ? <Text style={styles.distance}>{distanceLabel} entfernt</Text> : null}
            </View>
            <HapticButton
              haptic="light"
              onPress={handleClose}
              accessibilityLabel="Schließen"
              style={styles.closeButton}
            >
              <Symbol name="xmark" size={20} color={THEME.colors.text} />
            </HapticButton>
          </View>

          {/* Karte -- antippbar, oeffnet die Navigations-App aufs Geraet */}
          <HapticButton
            haptic="light"
            pressStyle="push"
            style={styles.section}
            onPress={() => openDirections(quest.lat, quest.lon, quest.title)}
            accessibilityLabel={`Route zu ${quest.title}`}
          >
            {(pressed) => (
              <BrutSurface radius={THEME.radius.md} contentStyle={styles.mapContent} pressed={pressed}>
                <MapView
                  style={styles.map}
                  // Sonst verschluckt die Karte die Tap-Geste vor dem HapticButton.
                  pointerEvents="none"
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                  initialRegion={{
                    latitude: quest.lat,
                    longitude: quest.lon,
                    latitudeDelta: MAP_DELTA,
                    longitudeDelta: MAP_DELTA,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  customMapStyle={HIDE_POI_STYLE}
                  showsUserLocation
                  showsPointsOfInterests={false}
                  showsCompass={false}
                >
                  <Marker coordinate={{ latitude: quest.lat, longitude: quest.lon }} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={styles.markerWrap}>
                      <View style={styles.markerShadow} />
                      <View style={[styles.markerCore, { backgroundColor: color }]} />
                    </View>
                  </Marker>
                </MapView>
                {/* Hinweis-Chip, faengt selbst keine Geste ab */}
                <View style={styles.routeChip} pointerEvents="none">
                  <Symbol
                    name="arrow.triangle.turn.up.right.diamond.fill"
                    size={13}
                    color={THEME.colors.onSignal}
                  />
                  <Text style={styles.routeChipText}>Route</Text>
                </View>
              </BrutSurface>
            )}
          </HapticButton>

          {/* Beweis: Foto machen, ohne Foto bestaetigen, oder das Ergebnis zeigen */}
          {!done ? (
            <View style={styles.section}>
              <BrutButton label="Foto machen" icon="camera.viewfinder" onPress={handleOpenCamera} />
              <BrutButton
                label="Ohne Foto bestätigen"
                tone="surface"
                onPress={handleFallbackConfirm}
                style={styles.fallbackButton}
              />
              {problem ? <Text style={styles.problemText}>{problem}</Text> : null}
              {blocked ? (
                <BrutButton
                  label="Einstellungen öffnen"
                  icon="gear"
                  tone="surface"
                  onPress={() => openSettings().catch(() => undefined)}
                  style={styles.fallbackButton}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.eyebrow}>DEIN BEWEIS</Text>
              {photoUri && !photoLoadFailed ? (
                <BrutSurface radius={THEME.radius.md} contentStyle={styles.photoContent}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photo}
                    onError={() => setPhotoLoadFailed(true)}
                  />
                </BrutSurface>
              ) : (
                <BrutSurface tone="sunken" radius={THEME.radius.md}>
                  <Text style={styles.proofNote}>
                    {photoUri && photoLoadFailed
                      ? 'Das Bild liegt nicht mehr am Gerät.'
                      : 'Ohne Foto bestätigt. Der Ort zählt, das Bild fehlt.'}
                  </Text>
                </BrutSurface>
              )}
            </View>
          )}

          {/* Wissen */}
          <View style={styles.section}>
            <Text style={styles.eyebrow}>WAS HIER STEHT</Text>
            <Text style={styles.infoText}>{quest.info}</Text>
          </View>

          {/* Kennzahlen */}
          <View style={styles.section}>
            {done ? (
              <BrutSurface tone="sunken" radius={THEME.radius.md}>
                {quest.stats.map((stat, index) => (
                  <View
                    key={stat.label}
                    style={[styles.statRow, index > 0 && styles.statRowDivider]}
                  >
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </BrutSurface>
            ) : (
              <BrutSurface tone="sunken" radius={THEME.radius.md}>
                <Text style={styles.teaserText}>{quest.teaser}</Text>
                <Text style={styles.teaserHint}>
                  {quest.stats.length} Kennzahlen warten hier
                </Text>
              </BrutSurface>
            )}
          </View>

          {/* Fakt oder Slop */}
          {done && trivia.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.heading}>Fakt oder Slop</Text>
              {trivia.map((t) => (
                <TriviaEntry
                  key={t.id}
                  triviaId={t.id}
                  answered={answeredTriviaIds.includes(t.id)}
                />
              ))}
            </View>
          ) : null}

          {/* Fuss */}
          <View style={styles.footer}>
            <Text style={styles.source} numberOfLines={1}>
              {quest.source}
            </Text>
            <Text style={styles.waterGain}>+{formatLiters(quest.waterLiters)}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/*
        Die Kamera liegt bewusst ueber allem und nicht als 260px-Fenster im
        Fliesstext: man zielt mit dem ganzen Geraet, und ein Sucher, der mit
        der Seite wegscrollt, ist keiner. Der Ausloeser liegt ueber dem Bild,
        wo die Hand ihn beim Halten ohnehin hat.

        Als Flaeche im selben Modal, nicht als zweites Modal darin: ein
        `pageSheet` mit einem Vollbild-Modal als Kind praesentiert auf iOS
        unzuverlaessig -- der Sucher blieb dabei schwarz oder ging gar nicht
        erst auf.
      */}
      {cameraOpen ? (
        <View style={styles.cameraRoot}>
          <CameraView
            ref={cameraRef}
            facing="back"
            style={StyleSheet.absoluteFill}
            onCameraReady={() => setCameraReady(true)}
          />
          <SafeAreaView style={styles.cameraBar} edges={['bottom']} pointerEvents="box-none">
            {problem ? (
              <BrutSurface radius={THEME.radius.md} style={styles.cameraProblem}>
                <Text style={[styles.problemText, styles.problemTextFlush]}>{problem}</Text>
              </BrutSurface>
            ) : null}
            <BrutButton
              label={cameraReady ? 'Auslösen' : 'Kamera startet …'}
              icon="camera.viewfinder"
              haptic="heavy"
              disabled={!cameraReady || busy}
              onPress={handleShutter}
            />
            <BrutButton
              label="Abbrechen"
              tone="surface"
              onPress={closeCamera}
              style={styles.cameraCancel}
            />
          </SafeAreaView>
        </View>
      ) : null}
    </Modal>
  );
}

/**
 * Eine einzelne Aussage im Sheet. Haelt ihren eigenen "beantwortet"-Zustand
 * fuer die aktuelle Sitzung, damit `onNext` innerhalb einer Liste sinnvoll ist
 * -- FactOrSlopCard rendert bereits beantwortete Aussagen nicht neu weg,
 * sondern zeigt ihr eigenes Ergebnis, solange sie sichtbar bleibt.
 */
function TriviaEntry({ triviaId, answered }: { triviaId: string; answered: boolean }) {
  const { answerTrivia } = useGameStore();
  const quest = TRIVIA_QUESTS.find((t) => t.id === triviaId);
  const [dismissed, setDismissed] = useState(answered);
  if (!quest) return null;
  if (dismissed) {
    return (
      <BrutSurface tone="sunken" radius={THEME.radius.md} style={styles.triviaDone}>
        <Text style={styles.triviaDoneText}>{quest.statement}</Text>
      </BrutSurface>
    );
  }
  return (
    <FactOrSlopCard
      quest={quest}
      onAnswer={answerTrivia}
      onNext={() => setDismissed(true)}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  symbolBadge: {
    width: 52,
    height: 52,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  badgeBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surfaceSunken,
  },
  badgeText: {
    ...THEME.type.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    color: THEME.colors.text,
    textTransform: 'uppercase',
  },
  title: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  location: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  distance: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: THEME.spacing.lg,
  },
  mapContent: {
    padding: 0,
    overflow: 'hidden',
    // Traeger fuer den absolut positionierten Route-Chip.
    position: 'relative',
  },
  map: {
    width: '100%',
    height: 180,
  },
  routeChip: {
    position: 'absolute',
    right: THEME.spacing.xs,
    bottom: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
  },
  routeChipText: {
    ...THEME.type.captionStrong,
    fontSize: 12,
    lineHeight: 14,
    color: THEME.colors.onSignal,
  },
  markerWrap: {
    width: 24,
    height: 24,
  },
  markerShadow: {
    position: 'absolute',
    top: THEME.shadow.offsetSm,
    left: THEME.shadow.offsetSm,
    width: 20,
    height: 20,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.ink,
  },
  markerCore: {
    width: 20,
    height: 20,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
  },
  cameraRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.colors.ink,
  },
  cameraBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  cameraProblem: {
    marginBottom: THEME.spacing.xs,
  },
  cameraCancel: {
    marginBottom: THEME.spacing.xs,
  },
  /**
   * Volle Breite, gleiche Groesse wie der gelbe Knopf darueber. Vorher stand
   * hier `alignSelf: 'flex-start'` -- das landet in `HapticButton` auf der
   * inneren Flaeche, waehrend das `Pressable` darueber weiter ueber die ganze
   * Breite lag. Sichtbarer Knopf und Trefferflaeche gingen so auseinander.
   */
  fallbackButton: {
    marginTop: THEME.spacing.sm,
  },
  problemText: {
    ...THEME.type.body,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
  },
  /** In der Kamera sitzt der Satz schon in einer gepolsterten Flaeche. */
  problemTextFlush: {
    marginTop: 0,
  },
  proofNote: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
  },
  photoContent: {
    padding: 0,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  eyebrow: {
    ...THEME.type.eyebrow,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.xs,
  },
  infoText: {
    ...THEME.type.body,
    color: THEME.colors.text,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  statRowDivider: {
    borderTopWidth: THEME.border.thin,
    borderTopColor: THEME.border.color,
  },
  statLabel: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  statValue: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  teaserText: {
    ...THEME.type.body,
    color: THEME.colors.textFaint,
  },
  teaserHint: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textFaint,
    marginTop: THEME.spacing.xs,
  },
  heading: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  triviaDone: {
    marginBottom: THEME.spacing.sm,
  },
  triviaDoneText: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
  },
  source: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    flexShrink: 1,
  },
  waterGain: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
});

export default QuestDetailSheet;
