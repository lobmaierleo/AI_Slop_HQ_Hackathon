import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutSurface } from '@/components/BrutSurface';
import { HapticButton } from '@/components/HapticButton';
import { LeaderboardBlock } from '@/components/LeaderboardBlock';
import { StatCard } from '@/components/StatCard';
import { Symbol } from '@/components/Symbol';
import { activeEdges, EDGES } from '@/lib/net';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

/** Tag im Jahr (0-basiert) -- deterministisch, damit der Spot im Pitch reproduzierbar bleibt. */
function dayOfYear(date: Date): number {
  const yearStart = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - yearStart.getTime()) / 86400000);
}

export default function OverviewScreen() {
  const router = useRouter();
  const { savedWaterLiters, aiQueriesAvoided, completedQuestIds, requestSegment, resetProgress } =
    useGameStore();

  // Fixer Tagesindex statt Math.random() -- derselbe Spot fuer alle an einem Tag.
  const spot = useMemo(() => PHOTO_QUESTS[dayOfYear(new Date()) % PHOTO_QUESTS.length], []);
  const edgeCount = useMemo(() => activeEdges(completedQuestIds).length, [completedQuestIds]);
  const edgeTotal = EDGES.length;

  const [displayLiters, setDisplayLiters] = useState(0);
  const [filledSegments, setFilledSegments] = useState(0);
  const literAnim = useRef(new Animated.Value(0)).current;
  const segmentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listener statt Native Driver, weil hier ein Textwert und keine Style-Prop mitzaehlt.
    const id = literAnim.addListener(({ value }) => setDisplayLiters(value));
    Animated.timing(literAnim, {
      toValue: savedWaterLiters,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => literAnim.removeListener(id);
  }, [literAnim, savedWaterLiters]);

  useEffect(() => {
    // Der Balken ist kein Verlauf mehr, sondern 42 Kaesten -- also zaehlt hier
    // eine ganze Zahl hoch statt einer Breite.
    const id = segmentAnim.addListener(({ value }) => setFilledSegments(Math.round(value)));
    Animated.timing(segmentAnim, {
      toValue: edgeCount,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => segmentAnim.removeListener(id);
  }, [segmentAnim, edgeCount]);

  const goToSpot = () => {
    requestSegment('photo');
    router.push('/(tabs)/quests');
  };

  // Beim Voting wandert das Geraet durch viele Hände. Ein versehentlicher Tap
  // darf nicht das ganze Netz löschen.
  const confirmReset = () => {
    Alert.alert(
      'Fortschritt zurücksetzen?',
      'Alle entdeckten Orte, Synapsen und gesparten Liter werden gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Zurücksetzen', style: 'destructive', onPress: resetProgress },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BrutSurface tone="primary" contentStyle={styles.heroContent}>
          <Text style={styles.heroHeading}>Menschliches Erkenntnis-Netz</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricValue}>{displayLiters.toFixed(1)}</Text>
            <Text style={styles.metricUnit}>L</Text>
          </View>
          <Text style={styles.heroCaption}>Kühlwasser, das deine Neugier nicht verdampft hat</Text>

          <SegmentBar filled={filledSegments} total={edgeTotal} />
          <Text style={styles.progressLabel}>
            {edgeCount} von {edgeTotal} Synapsen aktiv
          </Text>
        </BrutSurface>

        <View style={styles.statsRow}>
          <StatCard
            symbol="drop.fill"
            tone="tertiary"
            value={`${savedWaterLiters.toFixed(1)} L`}
            label="Eingespartes Wasser"
            caption="Nicht verdampftes Kühlwasser"
            style={styles.statCard}
          />
          <StatCard
            symbol="brain"
            tone="secondary"
            value={`${edgeCount}/${edgeTotal}`}
            label="Aktive Synapsen"
            caption="Verknüpfte Entdeckungen"
            style={styles.statCard}
          />
          <StatCard
            symbol="magnifyingglass"
            tone="surface"
            value={String(aiQueriesAvoided)}
            label="Vermiedene Abfragen"
            caption="Nicht gestellte KI-Fragen"
            style={styles.statCard}
          />
        </View>

        <SectionHeading text="Wer spart am meisten" tone={THEME.category.water} />
        <LeaderboardBlock playerLiters={savedWaterLiters} />

        <SectionHeading text="Spot des Tages" tone={THEME.colors.secondary} />
        <BrutSurface contentStyle={styles.spotContent}>
          <View style={styles.spotTopRow}>
            <View style={styles.spotIcon}>
              <Symbol name={spot.symbol} size={20} color={THEME.colors.ink} />
            </View>
            <View style={styles.spotBadge}>
              <Text style={styles.spotBadgeText}>{spot.badge}</Text>
            </View>
          </View>
          <Text style={styles.spotTitle}>{spot.title}</Text>
          <Text style={styles.spotLocation}>{spot.location}</Text>
          <Text style={styles.spotTeaser}>{spot.teaser}</Text>

          <HapticButton
            haptic="medium"
            pressStyle="push"
            style={styles.spotCtaWrap}
            onPress={goToSpot}
            accessibilityLabel="Zur Entdeckung"
          >
            {(pressed) => (
              <BrutSurface
                tone="primary"
                pressed={pressed}
                radius={THEME.radius.sm}
                contentStyle={styles.spotCta}
              >
                <Text style={styles.spotCtaText}>Zur Entdeckung</Text>
              </BrutSurface>
            )}
          </HapticButton>
        </BrutSurface>

        <HapticButton haptic="selection" style={styles.resetLink} onPress={confirmReset}>
          <Text style={styles.resetLinkText}>Fortschritt zurücksetzen</Text>
        </HapticButton>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Der Fortschritt als 42 Kaesten statt als Balken. Auf Armlaenge -- und so wird
 * das Geraet beim Voting gehalten -- zaehlt man Kaesten, eine Balkenbreite
 * schaetzt man nur.
 */
function SegmentBar({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={styles.segmentTrack}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, i < filled && styles.segmentOn]} />
      ))}
    </View>
  );
}

/** Abschnittsmarke: ein Farbklotz, daneben die Zeile in Versalien. */
function SectionHeading({ text, tone }: { text: string; tone: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionMark, { backgroundColor: tone }]} />
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.tabBarClearance,
  },
  heroContent: {
    gap: THEME.spacing.xs,
  },
  heroHeading: {
    ...THEME.type.heading,
    color: THEME.colors.onSignal,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  metricValue: {
    ...THEME.type.metric,
    color: THEME.colors.onSignal,
  },
  metricUnit: {
    ...THEME.type.title,
    color: THEME.colors.onSignal,
  },
  heroCaption: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
  },
  segmentTrack: {
    marginTop: THEME.spacing.md,
    flexDirection: 'row',
    gap: 1,
    height: 20,
    padding: 2,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
  },
  segmentOn: {
    backgroundColor: THEME.colors.ink,
  },
  progressLabel: {
    ...THEME.type.captionStrong,
    color: THEME.colors.onSignal,
    marginTop: THEME.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.sm,
  },
  sectionMark: {
    width: 14,
    height: 14,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
  },
  sectionText: {
    ...THEME.type.eyebrow,
    color: THEME.colors.text,
    textTransform: 'uppercase',
  },
  spotContent: {
    gap: THEME.spacing.xs,
  },
  spotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  spotIcon: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.secondary,
  },
  spotBadgeText: {
    ...THEME.type.eyebrow,
    color: THEME.colors.onSignal,
  },
  spotTitle: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  spotLocation: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
  },
  spotTeaser: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
  spotCtaWrap: {
    marginTop: THEME.spacing.md,
  },
  spotCta: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotCtaText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
  },
  resetLinkText: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textFaint,
  },
});
