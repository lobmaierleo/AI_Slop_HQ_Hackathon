import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';
import { Symbol } from '@/components/Symbol';
import type { SymbolName } from '@/components/Symbol';
import { THEME } from '@/theme/colors';

type Props = {
  symbol: SymbolName;
  value: string;
  label: string;
  caption: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Metrik-Kachel auf Glas: ein SF Symbol, eine Kennzahl, zwei Zeilen Kontext.
 * `adjustsFontSizeToFit` uebernimmt das Schrumpfen, wenn drei Karten
 * nebeneinander stehen -- dafuer keine eigene, zweite Zahlengroesse erfinden.
 */
export function StatCard({ symbol, value, label, caption, accent, style }: Props) {
  return (
    <GlassSurface radius={THEME.radius.lg} style={style} contentStyle={styles.content}>
      <View style={[styles.badge, { backgroundColor: THEME.colors.primarySoft }]}>
        <Symbol name={symbol} size={20} color={accent ?? THEME.colors.primary} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: THEME.spacing.xs,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...THEME.type.metric,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  label: {
    ...THEME.type.caption,
    color: THEME.colors.text,
  },
  caption: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
  },
});

export default StatCard;
