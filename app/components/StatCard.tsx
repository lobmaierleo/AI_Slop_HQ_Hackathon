import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { THEME } from '@/theme/colors';

type Props = {
  emoji: string;
  value: string;
  label: string;
  caption: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/** Verspielte Metrik-Kachel für Team-Fortschrittswerte. */
export function StatCard({ emoji, value, label, caption, accent, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.badge, { backgroundColor: accent ?? THEME.colors.primaryLight }]}>
        <Text style={styles.badgeEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    padding: 18,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  value: {
    fontSize: 30,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: -1,
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  caption: {
    marginTop: 2,
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
  },
});

export default StatCard;
