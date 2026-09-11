import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from '@/components/GlassSurface';
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
      <GlassSurface radius={THEME.radius.lg} glow={completed} contentStyle={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Symbol name={quest.symbol} size={17} color={THEME.colors.primary} />
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
            <Symbol name="xmark" size={14} color={THEME.colors.textFaint} />
          </HapticButton>
        </View>

        {completed ? (
          <>
            <Text style={styles.fact}>{quest.fact}</Text>
            <View style={styles.foot}>
              <Symbol name="checkmark.seal.fill" size={14} color={THEME.colors.success} />
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
              style={styles.cta}
              onPress={onNavigate}
              accessibilityLabel="Zur Quest"
            >
              <Text style={styles.ctaText}>Zur Quest</Text>
            </HapticButton>
          </>
        )}
      </GlassSurface>
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
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  location: { ...THEME.type.caption, color: THEME.colors.textFaint },
  close: {
    width: 30,
    height: 30,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaser: { ...THEME.type.body, color: THEME.colors.textMuted },
  fact: { ...THEME.type.body, color: THEME.colors.text },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  foundText: { ...THEME.type.caption, color: THEME.colors.success, flex: 1 },
  liters: { ...THEME.type.bodyStrong, color: THEME.colors.primary },
  cta: {
    height: 46,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...THEME.type.bodyStrong, color: THEME.colors.onAccent },
});

export default MapQuestCard;
