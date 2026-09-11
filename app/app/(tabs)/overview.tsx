import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticButton } from '@/components/HapticButton';
import { StatCard } from '@/components/StatCard';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

export default function OverviewScreen() {
  const router = useRouter();
  const { team, waterLiters, slopTokens, agiProgress, requestSegment, resetGame } = useGameStore();

  const anim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  const spot = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % PHOTO_QUESTS.length;
    return PHOTO_QUESTS[dayIndex];
  }, []);

  useEffect(() => {
    const pct = Math.min(100, Math.max(0, agiProgress)) / 100;
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [agiProgress, anim]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  };

  // Ohne Team gibt es nichts anzuzeigen — zurück zur Team-Auswahl unter `/`.
  if (!team) {
    return <Redirect href="/" />;
  }

  const goToSpot = () => {
    requestSegment('photo');
    router.push('/quests');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: team.color }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeEmoji}>{team.emoji}</Text>
            </View>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTeamName}>{team.name}</Text>
              <View style={styles.rankPill}>
                <Text style={styles.rankPillText}>Platz {team.rank} im Linzer Race</Text>
              </View>
            </View>
          </View>

          <View style={styles.agiRow}>
            <Text style={styles.agiLabel}>bis AGI</Text>
            <Text style={styles.agiValue}>{agiProgress.toFixed(1)} %</Text>
          </View>

          <View style={styles.track} onLayout={handleTrackLayout}>
            <Animated.View
              style={[
                styles.trackFill,
                {
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-trackWidth / 2, 0],
                      }),
                    },
                    { scaleX: anim },
                  ],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            emoji="💧"
            value={`${waterLiters.toFixed(1)} L`}
            label="Wasserverbrauch"
            caption="Linzer Donauwasser verdampft"
          />
          <StatCard
            emoji="⚡"
            value={`${(slopTokens / 1000).toFixed(1)} kTok`}
            label="Slop trainiert"
            caption="Synthetische Daten gefüttert"
            accent={THEME.colors.primaryLight}
          />
        </View>

        <Text style={styles.sectionHeading}>Linz Spot des Tages</Text>

        <View style={styles.spotCard}>
          <View style={styles.spotTopRow}>
            <View style={styles.spotBadgeCircle}>
              <Text style={styles.spotBadgeEmoji}>{spot.emoji}</Text>
            </View>
            <View style={styles.spotBadgePill}>
              <Text style={styles.spotBadgePillText}>{spot.badge}</Text>
            </View>
          </View>

          <Text style={styles.spotTitle}>{spot.title}</Text>
          <Text style={styles.spotLocation}>{spot.location}</Text>
          <Text style={styles.spotTeaser}>{spot.teaser}</Text>

          <HapticButton haptic="medium" style={styles.ctaButton} onPress={goToSpot}>
            <Text style={styles.ctaButtonText}>Zur Kühl-Mission springen →</Text>
          </HapticButton>
        </View>

        <HapticButton haptic="selection" style={styles.resetLink} onPress={resetGame}>
          <Text style={styles.resetLinkText}>Neu starten</Text>
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
    paddingHorizontal: 24,
    paddingBottom: THEME.tabBarClearance,
  },
  heroCard: {
    marginTop: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeEmoji: {
    fontSize: 24,
  },
  heroTitleWrap: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  heroTeamName: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.onAccent,
  },
  rankPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onAccent,
  },
  agiRow: {
    marginTop: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  agiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  agiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.colors.onAccent,
  },
  track: {
    marginTop: THEME.spacing.sm,
    height: 12,
    borderRadius: THEME.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.onAccent,
  },
  statsRow: {
    marginTop: THEME.spacing.md,
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeading: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: THEME.colors.primary,
  },
  spotCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    padding: 20,
  },
  spotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotBadgeEmoji: {
    fontSize: 20,
  },
  spotBadgePill: {
    marginLeft: THEME.spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primaryLight,
  },
  spotBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  spotTitle: {
    marginTop: THEME.spacing.md,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: THEME.colors.text,
  },
  spotLocation: {
    marginTop: 2,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  spotTeaser: {
    marginTop: THEME.spacing.sm,
    fontSize: 15,
    lineHeight: 21,
    color: THEME.colors.text,
  },
  ctaButton: {
    marginTop: THEME.spacing.lg,
    height: 54,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.onAccent,
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: THEME.spacing.lg,
  },
  resetLinkText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
});
