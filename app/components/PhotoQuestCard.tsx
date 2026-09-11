import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

import { HapticButton } from '@/components/HapticButton';
import { THEME } from '@/theme/colors';
import type { PhotoQuest } from '@/state/useGameStore';

type Props = {
  quest: PhotoQuest;
  done: boolean;
  onComplete: (questId: string) => void;
};

const SCAN_DURATION = 1000;
const VERIFY_DELAY = 600;

export function PhotoQuestCard({ quest, done, onComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);

  const laserProgress = useRef(new Animated.Value(0)).current;
  const verifyOpacity = useRef(new Animated.Value(0)).current;
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

  const handleLayout = (event: LayoutChangeEvent) => {
    setCardHeight(event.nativeEvent.layout.height);
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

  const isWater = quest.type === 'water';
  const badgeBg = isWater ? THEME.colors.primaryLight : THEME.colors.successLight;
  const badgeColor = isWater ? THEME.colors.primary : THEME.colors.success;

  const translateY = laserProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(cardHeight - 2, 0)],
  });

  return (
    <View
      style={[styles.card, done ? styles.cardDone : null]}
      onLayout={handleLayout}
    >
      <View style={styles.header}>
        <View style={[styles.emojiBadge, { backgroundColor: badgeBg }]}>
          <Text style={styles.emoji}>{quest.emoji}</Text>
        </View>
        <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{quest.badge}</Text>
        </View>
      </View>

      <Text style={styles.title}>{quest.title}</Text>
      <Text style={styles.location}>{quest.location}</Text>
      <Text style={styles.desc}>{quest.desc}</Text>

      <View style={styles.footer}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>+{quest.tokens} Tokens</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>+{quest.waterLiters} L</Text>
        </View>
      </View>

      {done ? (
        <View style={styles.successPill}>
          <Text style={styles.successText}>✓ Mission erledigt</Text>
        </View>
      ) : (
        <HapticButton
          haptic="medium"
          style={styles.scanButton}
          onPress={startScan}
          accessibilityLabel="Foto scannen"
        >
          <Text style={styles.scanButtonText}>📷 Foto scannen</Text>
        </HapticButton>
      )}

      {scanning ? (
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View style={[styles.laser, { transform: [{ translateY }] }]} />
          <View style={styles.overlayTextWrap}>
            <Text style={styles.overlayText}>Analysiere Linzer Trainingsdaten…</Text>
            <Animated.Text style={[styles.overlayVerified, { opacity: verifyOpacity }]}>
              100 % Kühlwasser verifiziert!
            </Animated.Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    overflow: 'hidden',
    position: 'relative',
  },
  cardDone: {
    borderColor: `${THEME.colors.success}40`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: -0.4,
    marginTop: THEME.spacing.sm,
  },
  location: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  desc: {
    fontSize: 15,
    color: THEME.colors.text,
    lineHeight: 21,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  chip: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  scanButton: {
    height: 50,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.onAccent,
  },
  successPill: {
    height: 50,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,26,30,0.92)',
    borderRadius: THEME.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laser: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  overlayTextWrap: {
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  overlayText: {
    fontSize: 14,
    color: THEME.colors.onAccent,
    textAlign: 'center',
  },
  overlayVerified: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default PhotoQuestCard;
