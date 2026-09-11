import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LEADERBOARD_ROW_GAP,
  LEADERBOARD_ROW_HEIGHT,
  LeaderboardRow,
} from '@/components/LeaderboardRow';
import { TEAMS, useGameStore } from '@/state/useGameStore';
import type { TeamId } from '@/state/useGameStore';
import { useLeaderboard } from '@/state/useLeaderboard';
import { THEME } from '@/theme/colors';

const STEP = LEADERBOARD_ROW_HEIGHT + LEADERBOARD_ROW_GAP;

export default function LeaderboardScreen() {
  const { team, agiProgress, waterLiters } = useGameStore();
  const entries = useLeaderboard(team?.id ?? null, agiProgress, waterLiters);

  // Ein Animated.Value pro Lab, stabil über die ganze Screen-Lebenszeit — die
  // Zeilen bleiben gemountet, nur ihre translateY-Position ändert sich. So
  // entsteht der Platzwechsel-Effekt ohne Remounts und ohne LayoutAnimation.
  const positionsRef = useRef<Record<TeamId, Animated.Value> | null>(null);
  if (!positionsRef.current) {
    const initial = {} as Record<TeamId, Animated.Value>;
    TEAMS.forEach((entry, index) => {
      initial[entry.id] = new Animated.Value(index * STEP);
    });
    positionsRef.current = initial;
  }
  const positions = positionsRef.current;

  useEffect(() => {
    const animations = entries.map((entry, index) =>
      Animated.spring(positions[entry.team.id], {
        toValue: index * STEP,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
    );
    Animated.parallel(animations).start();
  }, [entries, positions]);

  const boardHeight = TEAMS.length * STEP - LEADERBOARD_ROW_GAP;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.subtitle}>
          {team
            ? 'Wer schmilzt Linz zuerst für die AGI?'
            : 'Wähle ein Lab in der Übersicht, um mitzurennen.'}
        </Text>
      </View>

      <View style={[styles.board, { height: boardHeight }]}>
        {entries.map((entry, index) => (
          <Animated.View
            key={entry.team.id}
            style={[styles.rowWrap, { transform: [{ translateY: positions[entry.team.id] }] }]}
          >
            <LeaderboardRow
              team={entry.team}
              rank={index + 1}
              agiProgress={entry.agiProgress}
              waterLiters={entry.waterLiters}
              isPlayer={entry.isPlayer}
            />
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: THEME.spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: THEME.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  board: {
    position: 'relative',
    marginTop: THEME.spacing.lg,
    marginHorizontal: 24,
    marginBottom: THEME.tabBarClearance,
  },
  rowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
