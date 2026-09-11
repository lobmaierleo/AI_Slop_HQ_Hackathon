import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BrutSurface } from '@/components/BrutSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

type Props = {
  quest: PhotoQuest;
  completed: boolean;
  onNavigate: () => void;
  onClose: () => void;
};

/** Karte zum angetippten Marker: Titel, Ort, Teaser oder freigeschalteter Fakt. */
export function MapQuestCard({ quest, completed, onNavigate, onClose }: Props) {
  const enter = useSharedValue(0);

  // Neu montiert wird die Karte nur beim ersten Marker; danach wechselt nur die
  // Quest. Der Key im Effekt laesst sie bei jedem Wechsel neu hereinfahren.
  useEffect(() => {
    enter.value = 0;
    enter.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [quest.id, enter]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 28 }],
  }));

  return (
    <Animated.View style={style}>
      <BrutSurface radius={THEME.radius.md} contentStyle={styles.card}>
        <View style={styles.header}>
          <View style={[styles.badge, completed && styles.badgeDone]}>
            <Symbol name={quest.symbol} size={17} color={THEME.colors.ink} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {quest.title}
            </Text>
            <Text style={styles.location} numberOfLines={1}>
              {quest.location}
            </Text>
          </View>
          <HapticButton
            haptic="light"
            scaleTo={0.9}
            style={styles.close}
            onPress={onClose}
            accessibilityLabel="Schließen"
          >
            <Symbol name="xmark" size={14} color={THEME.colors.ink} />
          </HapticButton>
        </View>

        {completed ? (
          <>
            <Text style={styles.fact}>{quest.fact}</Text>
            <View style={styles.foot}>
              <Symbol name="checkmark.seal.fill" size={14} color={THEME.colors.ink} />
              <Text style={styles.foundText}>Entdeckt</Text>
              <Text style={styles.liters}>
                +{quest.waterLiters.toFixed(1).replace('.', ',')} L
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.teaser} numberOfLines={3}>
              {quest.teaser}
            </Text>
            <HapticButton
              haptic="medium"
              pressStyle="push"
              onPress={onNavigate}
              accessibilityLabel="Zur Quest"
            >
              {(pressed) => (
                <BrutSurface
                  tone="primary"
                  pressed={pressed}
                  shadow="sm"
                  radius={THEME.radius.sm}
                  contentStyle={styles.cta}
                >
                  <Text style={styles.ctaText}>Zur Quest</Text>
                </BrutSurface>
              )}
            </HapticButton>
          </>
        )}
      </BrutSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: THEME.spacing.md, gap: THEME.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.sm },
  headerText: { flex: 1 },
  badge: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: THEME.colors.success },
  title: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  location: { ...THEME.type.caption, color: THEME.colors.textMuted },
  close: {
    width: 30,
    height: 30,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaser: { ...THEME.type.body, color: THEME.colors.textMuted },
  fact: { ...THEME.type.body, color: THEME.colors.text },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: THEME.spacing.xs,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.success,
  },
  foundText: { ...THEME.type.captionStrong, color: THEME.colors.onSignal, flex: 1 },
  liters: { ...THEME.type.bodyStrong, color: THEME.colors.onSignal },
  cta: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...THEME.type.bodyStrong, color: THEME.colors.onSignal },
});

export default MapQuestCard;
