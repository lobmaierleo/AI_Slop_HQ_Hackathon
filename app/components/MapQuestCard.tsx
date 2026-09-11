import { StyleSheet, Text, View } from 'react-native';

import { HapticButton } from '@/components/HapticButton';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

type Props = {
  quest: PhotoQuest;
  completed: boolean;
  onNavigate: () => void;
  onClose: () => void;
};

/** Floating Karte für den angetippten Quest-Marker: Titel, Ort, Teaser, Weg zur Quest. */
export function MapQuestCard({ quest, completed, onNavigate, onClose }: Props) {
  return (
    <View style={styles.card}>
      <HapticButton
        haptic="light"
        scaleTo={0.9}
        style={styles.closeButton}
        onPress={onClose}
        accessibilityLabel="Schließen"
      >
        <Text style={styles.closeText}>×</Text>
      </HapticButton>

      <View style={styles.header}>
        <View style={styles.emojiBadge}>
          <Text style={styles.emoji}>{quest.emoji}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {quest.title}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {quest.location}
          </Text>
        </View>
      </View>

      <Text style={styles.teaser} numberOfLines={2}>
        {quest.teaser}
      </Text>

      {completed ? (
        <View style={styles.donePill}>
          <Text style={styles.doneText}>✓ Erledigt</Text>
        </View>
      ) : (
        <HapticButton
          haptic="medium"
          style={styles.ctaButton}
          onPress={onNavigate}
          accessibilityLabel="Zur Quest"
        >
          <Text style={styles.ctaText}>Zur Quest →</Text>
        </HapticButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.sm,
    right: THEME.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    lineHeight: 19,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingRight: 32,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: -0.3,
  },
  location: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  teaser: {
    fontSize: 14,
    color: THEME.colors.text,
    lineHeight: 19,
    marginTop: THEME.spacing.sm,
  },
  ctaButton: {
    height: 46,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.onAccent,
  },
  donePill: {
    height: 46,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.sm,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.success,
  },
});

export default MapQuestCard;
