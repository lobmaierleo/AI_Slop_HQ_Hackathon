import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { BrutSurface } from '@/components/BrutSurface';
import {
  LEADERBOARD_IDS,
  formatLiters,
  rankByWater,
  topWater,
  type LeaderboardEntry,
} from '@/lib/leaderboard';
import { THEME } from '@/theme/colors';

const CARD_HEIGHT = 46;
const ROW_HEIGHT = CARD_HEIGHT + THEME.shadow.offsetSm;
const ROW_GAP = 8;
const STEP = ROW_HEIGHT + ROW_GAP;

type Props = {
  playerLiters: number;
};

/**
 * Wer hat am meisten Kuehlwasser gespart.
 *
 * Die Zeilen bleiben in fester Reihenfolge gemountet, nur ihr `translateY`
 * aendert sich. So federt eine Zeile beim Rangwechsel sichtbar an ihren neuen
 * Platz, statt an anderer Stelle neu zu erscheinen -- das ist der Moment, den
 * man beim Herumreichen des Geraets sehen soll.
 */
export function LeaderboardBlock({ playerLiters }: Props) {
  const entries = useMemo(() => rankByWater(playerLiters), [playerLiters]);
  const max = useMemo(() => topWater(entries), [entries]);

  const byId = useMemo(() => {
    const map = new Map<string, { entry: LeaderboardEntry; rank: number }>();
    entries.forEach((entry, rank) => map.set(entry.id, { entry, rank }));
    return map;
  }, [entries]);

  // Ein Animated.Value je Zeile, stabil ueber die ganze Lebenszeit des Blocks.
  const positionsRef = useRef<Record<string, Animated.Value> | null>(null);
  if (!positionsRef.current) {
    const initial: Record<string, Animated.Value> = {};
    LEADERBOARD_IDS.forEach((id) => {
      initial[id] = new Animated.Value((byId.get(id)?.rank ?? 0) * STEP);
    });
    positionsRef.current = initial;
  }
  const positions = positionsRef.current;

  useEffect(() => {
    const animations = LEADERBOARD_IDS.map((id) =>
      Animated.spring(positions[id], {
        toValue: (byId.get(id)?.rank ?? 0) * STEP,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
    );
    Animated.parallel(animations).start();
  }, [byId, positions]);

  const boardHeight = LEADERBOARD_IDS.length * STEP - ROW_GAP;

  return (
    <View style={[styles.board, { height: boardHeight }]}>
      {LEADERBOARD_IDS.map((id) => {
        const row = byId.get(id);
        if (!row) return null;
        return (
          <Animated.View
            key={id}
            style={[styles.row, { transform: [{ translateY: positions[id] }] }]}
          >
            <Row entry={row.entry} rank={row.rank + 1} max={max} />
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Eine Zeile: Platz, Name, Balken in Wasserfarbe, Literwert. */
function Row({ entry, rank, max }: { entry: LeaderboardEntry; rank: number; max: number }) {
  const fill = max > 0 ? Math.max(entry.waterLiters / max, 0) : 0;

  return (
    <BrutSurface
      tone={entry.isPlayer ? 'primary' : 'surface'}
      shadow="sm"
      thinBorder={!entry.isPlayer}
      radius={THEME.radius.sm}
      contentStyle={styles.card}
    >
      <View style={[styles.bar, { width: `${fill * 100}%` }]} pointerEvents="none" />

      <View style={styles.rank}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.who}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.hint} numberOfLines={1}>
          {entry.hint}
        </Text>
      </View>

      <Text style={styles.liters}>{formatLiters(entry.waterLiters)} L</Text>
    </BrutSurface>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ROW_HEIGHT,
  },
  card: {
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 0,
    // Beschneidet den Balken an der Kante der Karte, nicht den Schatten --
    // der liegt als eigene Flaeche daneben.
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: THEME.colors.tertiary,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...THEME.type.captionStrong,
    color: THEME.colors.surface,
  },
  who: {
    flex: 1,
  },
  name: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
  hint: {
    ...THEME.type.caption,
    fontSize: 11,
    lineHeight: 14,
    color: THEME.colors.textMuted,
  },
  liters: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
});

export default LeaderboardBlock;
