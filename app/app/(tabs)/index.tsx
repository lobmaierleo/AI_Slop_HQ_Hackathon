import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/GlassSurface';
import { HapticButton } from '@/components/HapticButton';
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
  const progressPct = edgeTotal > 0 ? edgeCount / edgeTotal : 0;

  const [displayLiters, setDisplayLiters] = useState(0);
  const literAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, progressPct]);

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const goToSpot = () => {
    requestSegment('photo');
    router.push('/(tabs)/quests');
  };

  // Beim Voting wandert das iPhone durch viele Hände. Ein versehentlicher Tap
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
        <GlassSurface glow radius={THEME.radius.xl} contentStyle={styles.heroContent}>
          <Text style={styles.heroHeading}>Menschliches Erkenntnis-Netz</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricValue}>{displayLiters.toFixed(1)}</Text>
            <Text style={styles.metricUnit}>L</Text>
          </View>
          <Text style={styles.heroCaption}>Kühlwasser, das deine Neugier nicht verdampft hat</Text>

          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, { width: fillWidth }]} />
          </View>
          <Text style={styles.progressLabel}>
            {edgeCount} von {edgeTotal} Synapsen aktiv
          </Text>
        </GlassSurface>

        <View style={styles.statsRow}>
          <StatCard
            symbol="drop.fill"
            value={`${savedWaterLiters.toFixed(1)} L`}
            label="Eingespartes Wasser"
            caption="Nicht verdampftes Kühlwasser"
            style={styles.statCard}
          />
          <StatCard
            symbol="brain"
            value={`${edgeCount}/${edgeTotal}`}
            label="Aktive Synapsen"
            caption="Verknüpfte Entdeckungen"
            style={styles.statCard}
          />
          <StatCard
            symbol="magnifyingglass"
            value={String(aiQueriesAvoided)}
            label="Vermiedene Abfragen"
            caption="Nicht gestellte KI-Fragen"
            style={styles.statCard}
          />
        </View>

        <Text style={styles.sectionHeading}>Spot des Tages</Text>
        <GlassSurface radius={THEME.radius.lg} contentStyle={styles.spotContent}>
          <View style={styles.spotTopRow}>
            <Symbol name={spot.symbol} size={20} color={THEME.colors.primary} />
            <View style={styles.spotBadgePill}>
              <Text style={styles.spotBadgeText}>{spot.badge}</Text>
            </View>
          </View>
          <Text style={styles.spotTitle}>{spot.title}</Text>
          <Text style={styles.spotLocation}>{spot.location}</Text>
          <Text style={styles.spotTeaser}>{spot.teaser}</Text>
          <HapticButton haptic="medium" style={styles.spotCta} onPress={goToSpot}>
            <Text style={styles.spotCtaText}>Zur Entdeckung</Text>
          </HapticButton>
        </GlassSurface>

        <HapticButton haptic="selection" style={styles.resetLink} onPress={confirmReset}>
          <Text style={styles.resetLinkText}>Fortschritt zurücksetzen</Text>
        </HapticButton>
      </ScrollView>
    </SafeAreaView>
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
    color: THEME.colors.text,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  metricValue: {
    ...THEME.type.metric,
    color: THEME.colors.primary,
  },
  metricUnit: {
    ...THEME.type.title,
    color: THEME.colors.textMuted,
  },
  heroCaption: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
  },
  track: {
    marginTop: THEME.spacing.md,
    height: 6,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.track,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
  },
  progressLabel: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
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
    ...THEME.type.eyebrow,
    color: THEME.colors.primary,
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.sm,
  },
  spotContent: {
    gap: THEME.spacing.xs,
  },
  spotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  spotBadgePill: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs / 2,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
  },
  spotBadgeText: {
    ...THEME.type.eyebrow,
    color: THEME.colors.primary,
  },
  spotTitle: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  spotLocation: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
  },
  spotTeaser: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
  spotCta: {
    marginTop: THEME.spacing.md,
    height: 50,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotCtaText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onAccent,
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
  },
  resetLinkText: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
  },
});
