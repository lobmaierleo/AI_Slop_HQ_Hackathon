import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { BrutSurface, type Tone } from '@/components/BrutSurface';
import { HapticButton, type HapticKind } from '@/components/HapticButton';
import { Symbol, type SymbolName } from '@/components/Symbol';
import { THEME } from '@/theme/colors';

/**
 * Der eine Knopf der App.
 *
 * Vorher stand das Muster "HapticButton + BrutSurface + zentrierter Text" an
 * acht Stellen wortgleich -- und an jeder mit einer festen `height` in der
 * `contentStyle`. Das war der Fehler: `BrutSurface` polstert ihre Karte mit
 * `spacing.md`, eine Hoehe von 50 laesst dem Text also 18px, waehrend die
 * Zeilenhoehe des Fliesstexts 25 betraegt. Die Schrift wurde oben und unten
 * abgeschnitten.
 *
 * Deshalb gibt es hier keine feste Hoehe, sondern eine Mindesthoehe und ein
 * eigenes vertikales Polster. Der Knopf waechst mit seiner Beschriftung, statt
 * sie zu beschneiden -- auch zweizeilig, auch bei grosser Systemschrift.
 */

type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { minHeight: number; padV: number; padH: number; text: TextStyle }> = {
  sm: { minHeight: 40, padV: THEME.spacing.xs, padH: THEME.spacing.md, text: THEME.type.captionStrong },
  md: { minHeight: 50, padV: THEME.spacing.sm, padH: THEME.spacing.lg, text: THEME.type.bodyStrong },
  lg: { minHeight: 58, padV: THEME.spacing.sm, padH: THEME.spacing.lg, text: THEME.type.heading },
};

type Props = {
  label: string;
  onPress?: () => void;
  /** Fuellton. Gelb ist die Aktionsfarbe, alles andere die Ausnahme. */
  tone?: Tone;
  size?: Size;
  haptic?: HapticKind;
  disabled?: boolean;
  /** Zeichen links neben der Beschriftung. */
  icon?: SymbolName;
  shadow?: boolean | 'sm';
  /** Aeusserer Abstand. Rechts und unten muss `shadow.offset` Luft bleiben. */
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export function BrutButton({
  label,
  onPress,
  tone = 'primary',
  size = 'md',
  haptic = 'medium',
  disabled = false,
  icon,
  shadow = true,
  style,
  labelStyle,
  accessibilityLabel,
}: Props) {
  const metrics = SIZE[size];
  // Auf dunklen Fuelltoenen muss die Schrift hell sein, sonst verschwindet sie.
  const textColor = tone === 'ink' ? THEME.colors.surface : THEME.colors.onSignal;

  return (
    <HapticButton
      haptic={haptic}
      pressStyle="push"
      disabled={disabled}
      style={style}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {(pressed) => (
        <BrutSurface
          tone={tone}
          pressed={pressed}
          shadow={shadow}
          radius={THEME.radius.sm}
          contentStyle={[
            styles.face,
            {
              minHeight: metrics.minHeight,
              paddingVertical: metrics.padV,
              paddingHorizontal: metrics.padH,
            },
          ]}
        >
          <View style={styles.row}>
            {icon ? <Symbol name={icon} size={17} color={textColor} /> : null}
            <Text style={[metrics.text, { color: textColor }, styles.label, labelStyle]}>
              {label}
            </Text>
          </View>
        </BrutSurface>
      )}
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  // `flexShrink` laesst lange Beschriftungen umbrechen statt ueberzulaufen.
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});

export default BrutButton;
