import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { BrutSurface, type Tone } from '@/components/BrutSurface';
import { Symbol } from '@/components/Symbol';
import type { SymbolName } from '@/components/Symbol';
import { THEME } from '@/theme/colors';

type Props = {
  symbol: SymbolName;
  value: string;
  label: string;
  caption: string;
  /** Fuellton der Kachel. Die drei Kacheln einer Reihe tragen drei Signalfarben. */
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

/**
 * Metrik-Kachel: ein Icon im Kasten, eine Kennzahl, zwei Zeilen Kontext.
 * `adjustsFontSizeToFit` uebernimmt das Schrumpfen, wenn drei Karten
 * nebeneinander stehen -- dafuer keine eigene, zweite Zahlengroesse erfinden.
 */
export function StatCard({ symbol, value, label, caption, tone = 'surface', style }: Props) {
  return (
    <BrutSurface tone={tone} style={style} contentStyle={styles.content}>
      <View style={styles.badge}>
        <Symbol name={symbol} size={18} color={THEME.colors.ink} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </BrutSurface>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: THEME.spacing.xs,
    padding: THEME.spacing.sm,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...THEME.type.metric,
    color: THEME.colors.text,
  },
  label: {
    ...THEME.type.captionStrong,
    color: THEME.colors.text,
  },
  caption: {
    ...THEME.type.caption,
    fontSize: 12,
    lineHeight: 16,
    color: THEME.colors.textMuted,
  },
});

export default StatCard;
