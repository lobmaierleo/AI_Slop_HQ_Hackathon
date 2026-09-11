import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BrutSurface } from '@/components/BrutSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import { THEME } from '@/theme/colors';
import type { PhotoQuest } from '@/state/useGameStore';

type Props = {
  quest: PhotoQuest;
  done: boolean;
  onComplete: (questId: string) => void;
};

const SCAN_DURATION = 1000;
const VERIFY_DELAY = 600;

/** Deutsches Dezimalkomma, immer mit einer Nachkommastelle: 6.4 -> "6,4 L". */
function formatLiters(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} L`;
}

/**
 * Das Kernstück des Loops: Ort aufsuchen, "vor Ort bestätigen", und als
 * Belohnung den Fakt freischalten, den die KI einem sonst vorgekaut hätte.
 * Der Foto-Beweis bleibt eine Simulation -- kein Kamera-Zugriff --, aber die
 * Scan-Animation soll trotzdem wie eine echte Abgleichung mit offenen Daten
 * wirken, nicht wie ein Kühlkreislauf.
 */
export function PhotoQuestCard({ quest, done, onComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const laserProgress = useRef(new Animated.Value(0)).current;
  const verifyOpacity = useRef(new Animated.Value(0)).current;

  // Bereits vor dem Neustart erledigte Quests zeigen die Belohnung sofort
  // (Startwert = Endzustand), damit die Einblend-Animation nicht bei jedem
  // Scrollen erneut abgespielt wird. Nur ein frischer Abschluss in dieser
  // Sitzung löst die Animation aus.
  const revealOpacity = useRef(new Animated.Value(done ? 1 : 0)).current;
  const revealTranslate = useRef(new Animated.Value(done ? 0 : 10)).current;
  const wasDone = useRef(done);

  const laserAnim = useRef<Animated.CompositeAnimation | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (completeTimer.current) clearTimeout(completeTimer.current);
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
      laserAnim.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (done && !wasDone.current) {
      Animated.parallel([
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(revealTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
        }),
      ]).start();
    }
    wasDone.current = done;
  }, [done, revealOpacity, revealTranslate]);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  };

  const startScan = () => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    laserAnim.current?.stop();

    setScanning(true);
    laserProgress.setValue(0);
    verifyOpacity.setValue(0);

    laserAnim.current = Animated.timing(laserProgress, {
      toValue: 1,
      duration: SCAN_DURATION,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    laserAnim.current.start();

    verifyTimer.current = setTimeout(() => {
      if (!mounted.current) return;
      Animated.timing(verifyOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, VERIFY_DELAY);

    completeTimer.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!mounted.current) return;
      setScanning(false);
      onComplete(quest.id);
    }, SCAN_DURATION);
  };

  const translateY = laserProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(contentHeight - 4, 0)],
  });

  return (
    <BrutSurface radius={THEME.radius.md} style={styles.card}>
      <View onLayout={handleContentLayout}>
        <View style={styles.header}>
          <View style={[styles.symbolBadge, done && styles.symbolBadgeDone]}>
            <Symbol name={quest.symbol} size={22} color={THEME.colors.ink} />
          </View>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>{quest.badge}</Text>
          </View>
        </View>

        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.location}>{quest.location}</Text>
        <Text style={styles.desc}>{quest.desc}</Text>

        {!done ? (
          <HapticButton
            haptic="medium"
            pressStyle="push"
            style={styles.scanButton}
            onPress={startScan}
            accessibilityLabel="Vor Ort bestätigen"
          >
            {(pressed) => (
              <BrutSurface
                tone="primary"
                pressed={pressed}
                shadow="sm"
                radius={THEME.radius.sm}
                contentStyle={styles.scanButtonFace}
              >
                <Text style={styles.scanButtonText}>Vor Ort bestätigen</Text>
              </BrutSurface>
            )}
          </HapticButton>
        ) : (
          // Der eigentliche Zahltag: Fakt, Quelle und die gutgeschriebenen
          // Liter -- der Grund, warum man überhaupt hingegangen ist.
          <Animated.View
            style={[
              styles.reveal,
              { opacity: revealOpacity, transform: [{ translateY: revealTranslate }] },
            ]}
          >
            <View style={styles.revealLabelRow}>
              <Symbol name="checkmark.seal.fill" size={14} color={THEME.colors.ink} />
              <Text style={styles.revealLabel}>Entdeckt</Text>
            </View>
            <Text style={styles.factText}>{quest.fact}</Text>
            <View style={styles.revealFooter}>
              <Text style={styles.source} numberOfLines={1}>
                {quest.source}
              </Text>
              <Text style={styles.waterGain}>+{formatLiters(quest.waterLiters)}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {scanning ? (
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View style={[styles.laser, { transform: [{ translateY }] }]} />
          <View style={styles.overlayTextWrap}>
            <Text style={styles.overlayText}>Gleiche mit offenen Daten ab…</Text>
            <Animated.Text style={[styles.overlayVerified, { opacity: verifyOpacity }]}>
              Standort abgeglichen
            </Animated.Text>
          </View>
        </View>
      ) : null}
    </BrutSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  symbolBadge: {
    width: 46,
    height: 46,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Erledigt wechselt die Fuellung auf Gruen -- beim Durchscrollen der 23
  // Karten ist das der schnellste Unterschied.
  symbolBadgeDone: {
    backgroundColor: THEME.colors.success,
  },
  badgeBox: {
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
    marginTop: THEME.spacing.sm,
  },
  location: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  desc: {
    ...THEME.type.body,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
  },
  scanButton: {
    marginTop: THEME.spacing.lg,
  },
  scanButtonFace: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
  },
  reveal: {
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.success,
  },
  revealLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealLabel: {
    ...THEME.type.eyebrow,
    color: THEME.colors.onSignal,
  },
  factText: {
    ...THEME.type.body,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
  },
  revealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
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
  // Waehrend des Abgleichs deckt die Karte sich selbst zu: schwarze Flaeche,
  // ein gelber Balken laeuft durch. Kein Glas, kein Glow mehr.
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.colors.ink,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  laser: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: THEME.colors.primary,
  },
  overlayTextWrap: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  overlayText: {
    ...THEME.type.captionStrong,
    color: THEME.colors.surface,
    textAlign: 'center',
  },
  overlayVerified: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.primary,
    textAlign: 'center',
  },
});

export default PhotoQuestCard;
