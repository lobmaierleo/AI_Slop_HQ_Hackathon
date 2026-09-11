import { StyleSheet, Text, View } from 'react-native';

import { THEME } from '@/theme/colors';
import type { Team } from '@/state/useGameStore';

/** Feste Zeilenhöhe/Abstand, damit die Positionierung per translateY im Screen aufgeht. */
export const LEADERBOARD_ROW_HEIGHT = 92;
export const LEADERBOARD_ROW_GAP = 12;

const RANK_MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];

type Props = {
  team: Team;
  rank: number;
  agiProgress: number;
  waterLiters: number;
  isPlayer: boolean;
};

/** Eine Zeile im Ranking: Platz, Lab, AGI-Fortschritt und Wasserverbrauch. */
export function LeaderboardRow({ team, rank, agiProgress, waterLiters, isPlayer }: Props) {
  const medal = RANK_MEDALS[rank - 1] ?? `${rank}.`;

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: isPlayer ? team.tint : THEME.colors.card },
        isPlayer ? [styles.rowPlayer, { borderColor: team.color }] : styles.rowRival,
      ]}
    >
      <Text style={styles.medal}>{medal}</Text>

      <View style={[styles.emojiCircle, { backgroundColor: team.tint }]}>
        <Text style={styles.emoji}>{team.emoji}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {team.name}
          </Text>
          {isPlayer ? (
            <View style={[styles.youPill, { backgroundColor: team.color }]}>
              <Text style={styles.youPillText}>DU</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.tagline} numberOfLines={1}>
          {team.tagline}
        </Text>
      </View>

      <View style={styles.stats}>
        <Text style={[styles.agi, { color: team.color }]} numberOfLines={1} adjustsFontSizeToFit>
          {agiProgress.toFixed(1)}%
        </Text>
        <Text style={styles.water} numberOfLines={1}>
          💧 {waterLiters.toFixed(1)} L
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: LEADERBOARD_ROW_HEIGHT,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  rowRival: {
    borderColor: THEME.colors.hairline,
  },
  rowPlayer: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  medal: {
    width: 30,
    fontSize: 20,
    textAlign: 'center',
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: THEME.spacing.xs,
  },
  emoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    marginRight: THEME.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  youPill: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
  },
  youPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.onAccent,
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 2,
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  stats: {
    alignItems: 'flex-end',
  },
  agi: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  water: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
});

export default LeaderboardRow;
