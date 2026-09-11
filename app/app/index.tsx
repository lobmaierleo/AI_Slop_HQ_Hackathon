import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from '@/components/GlassSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import type { SymbolName } from '@/components/Symbol';
import { useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

/** Die drei Versprechen des Onboardings: Ortsbesuch, Ersparnis, Netz. */
const PROMISES: { symbol: SymbolName; title: string; desc: string }[] = [
  { symbol: 'figure.walk', title: 'Vor Ort hingehen', desc: 'Selbst nachsehen, statt zu fragen.' },
  { symbol: 'drop.fill', title: 'Kühlwasser einsparen', desc: 'Jede Entdeckung ersetzt eine Abfrage.' },
  { symbol: 'brain', title: 'Ein eigenes Netz knüpfen', desc: 'Jeder gefundene Ort wird ein Neuron.' },
];

type BlobProps = {
  size: number;
  top: number;
  left: number;
  duration: number;
  rangeX: number;
  rangeY: number;
};

/**
 * Ein driftender Leuchtfleck hinter dem Glas. Ohne etwas Bewegtes dahinter
 * bliebe der Blur der Glaszeilen unsichtbar -- er braucht ein Motiv, das er
 * verwischen kann.
 */
function Blob({ size, top, left, duration, rangeX, rangeY }: BlobProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-rangeX, rangeX]) },
      { translateY: interpolate(drift.value, [0, 1], [-rangeY, rangeY]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.blobWrap, { width: size, height: size, top, left }, style]}
    >
      <LinearGradient
        colors={[THEME.colors.primaryGlow, 'transparent']}
        style={[styles.blob, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
}

/**
 * Erster Eindruck der App: ruhiger dunkler Screen statt Team-Auswahl. Die
 * Satire ist weg -- hier wird erklaert, dass man selbst die Intelligenz ist.
 */
export default function OnboardingScreen() {
  const { start } = useGameStore();

  return (
    <View style={styles.root}>
      <Blob size={420} top={-140} left={-140} duration={18000} rangeX={30} rangeY={40} />
      <Blob size={360} top={300} left={220} duration={14000} rangeX={26} rangeY={30} />
      <Blob size={300} top={620} left={-90} duration={20000} rangeX={22} rangeY={26} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ARS ELECTRONICA 2026 · NEGOTIATING HUMANITY</Text>
          <Text style={styles.headline}>Verlerne nicht das Suchen.</Text>
          <Text style={styles.body}>
            Künstliche Intelligenz nimmt uns das Nachdenken ab und verdunstet dabei literweise
            Kühlwasser. Hol dir die Neugier zurück.
          </Text>
        </View>

        <View style={styles.rows}>
          {PROMISES.map((item) => (
            <GlassSurface key={item.title} radius={THEME.radius.lg} contentStyle={styles.rowContent}>
              <Symbol name={item.symbol} size={22} color={THEME.colors.primary} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
            </GlassSurface>
          ))}
        </View>

        <HapticButton
          haptic="heavy"
          style={styles.cta}
          onPress={start}
          accessibilityLabel="Eigenes Netz aktivieren"
        >
          <Text style={styles.ctaText}>Eigenes Netz aktivieren</Text>
        </HapticButton>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  blobWrap: {
    position: 'absolute',
  },
  blob: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  header: {
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.type.eyebrow,
    color: THEME.colors.primary,
  },
  headline: {
    ...THEME.type.display,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  body: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  rows: {
    gap: THEME.spacing.sm,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
  rowDesc: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
  },
  cta: {
    height: 58,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onAccent,
  },
});
