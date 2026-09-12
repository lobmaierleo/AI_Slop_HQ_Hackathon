import { StyleSheet, Text, View } from 'react-native';

import { BrutSurface } from '@/components/BrutSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import { formatDistance } from '@/lib/net';
import { THEME } from '@/theme/colors';
import type { PhotoQuest } from '@/state/useGameStore';

type Props = {
  quest: PhotoQuest;
  done: boolean;
  onPress: () => void;
  distanceM?: number;
};

/** Deutsches Dezimalkomma, immer mit einer Nachkommastelle: 6.4 -> "6,4 L". */
function formatLiters(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} L`;
}

/**
 * Reine Listenkachel: Plakette, Titel, Ort, ein Teaser oder die kurze
 * "Entdeckt"-Zeile. Bestaetigt wird nicht mehr hier, sondern im
 * QuestDetailSheet -- ein Tipp auf die Kachel oeffnet nur noch das Sheet.
 */
export function PhotoQuestCard({ quest, done, onPress, distanceM }: Props) {
  return (
    <HapticButton
      haptic="light"
      pressStyle="push"
      onPress={onPress}
      accessibilityLabel={quest.title}
      style={styles.wrap}
    >
      {(pressed) => (
        <BrutSurface radius={THEME.radius.md} pressed={pressed} contentStyle={styles.card}>
          <View style={[styles.symbolBadge, done && styles.symbolBadgeDone]}>
            <Symbol name={quest.symbol} size={22} color={THEME.colors.ink} />
          </View>

          <View style={styles.body}>
            <View style={styles.badgeBox}>
              <Text style={styles.badgeText}>{quest.badge}</Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {quest.title}
            </Text>
            <View style={styles.locationRow}>
              <Text style={styles.location} numberOfLines={1}>
                {quest.location}
              </Text>
              {distanceM !== undefined ? (
                <Text style={styles.distance}> · {formatDistance(distanceM)}</Text>
              ) : null}
            </View>
            {done ? (
              <View style={styles.doneRow}>
                <Symbol name="checkmark.seal.fill" size={13} color={THEME.colors.success} />
                <Text style={styles.doneText}>
                  Entdeckt · +{formatLiters(quest.waterLiters)}
                </Text>
              </View>
            ) : (
              <Text style={styles.teaser} numberOfLines={2}>
                {quest.teaser}
              </Text>
            )}
          </View>

          <Symbol name="chevron.right" size={18} color={THEME.colors.textMuted} />
        </BrutSurface>
      )}
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: THEME.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  symbolBadge: {
    width: 46,
    height: 46,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Erledigt wechselt die Fuellung auf Gruen -- beim Durchscrollen der 23
  // Karten ist das der schnellste Unterschied.
  symbolBadgeDone: {
    backgroundColor: THEME.colors.success,
  },
  body: {
    flex: 1,
  },
  badgeBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surfaceSunken,
  },
  badgeText: {
    ...THEME.type.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    color: THEME.colors.text,
    textTransform: 'uppercase',
  },
  title: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    marginTop: 1,
  },
  location: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    flexShrink: 1,
  },
  // Eigener, nicht schrumpfender Text -- die Distanz darf nicht verschwinden,
  // wenn der Ortsname per numberOfLines gekuerzt wird.
  distance: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    flexShrink: 0,
  },
  teaser: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: THEME.spacing.xs,
  },
  doneText: {
    ...THEME.type.captionStrong,
    color: THEME.colors.text,
  },
});

export default PhotoQuestCard;
