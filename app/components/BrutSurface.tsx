import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { THEME } from '@/theme/colors';

/** Die Fuelltoene, die eine Flaeche annehmen kann. */
export type Tone = 'surface' | 'sunken' | 'primary' | 'secondary' | 'tertiary' | 'ink';

const TONE_FILL: Record<Tone, string> = {
  surface: THEME.colors.surface,
  sunken: THEME.colors.surfaceSunken,
  primary: THEME.colors.primary,
  secondary: THEME.colors.secondary,
  tertiary: THEME.colors.tertiary,
  ink: THEME.colors.ink,
};

type Props = {
  children?: React.ReactNode;
  /** Fuellton der Flaeche. */
  tone?: Tone;
  /** Eckenradius. Flach halten -- dieser Stil rundet knapp. */
  radius?: number;
  /** Harter Versatzschatten. `'sm'` fuer Elemente unter 40px Hoehe. */
  shadow?: boolean | 'sm';
  /** Duennerer Rahmen, ebenfalls fuer kleine Elemente. */
  thinBorder?: boolean;
  /**
   * Verschiebt die Flaeche in ihren eigenen Schatten -- der Druckzustand. Wird
   * von HapticButton mit `pressStyle="push"` gesetzt.
   */
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Die eine Flaeche der App. Jede Karte, Leiste und Taste baut darauf auf.
 *
 * Aufbau: aussen ein Rahmen, dessen Polster rechts und unten genau den Versatz
 * freihaelt -- so gehoert der Schatten zur gemessenen Groesse und keine
 * Aufrufstelle muss Platz einplanen. Darin liegen deckungsgleich die schwarze
 * Schattenflaeche, um den Versatz verschoben, und die eigentliche Karte.
 *
 * Der Schatten ist bewusst eine eigene View und keine Style-Prop:
 * `shadowRadius: 0` gaebe es nur auf iOS, und Androids `elevation` zeichnet
 * immer weich und ohne steuerbaren Versatz. Eine schwarze Flaeche dahinter
 * sieht auf beiden Plattformen gleich aus.
 */
export function BrutSurface({
  children,
  tone = 'surface',
  radius = THEME.radius.md,
  shadow = true,
  thinBorder = false,
  pressed = false,
  style,
  contentStyle,
}: Props) {
  const offset = shadow === 'sm' ? THEME.shadow.offsetSm : THEME.shadow.offset;
  const hasShadow = shadow !== false;
  const room = hasShadow ? offset : 0;

  return (
    <View style={[styles.root, { paddingRight: room, paddingBottom: room }, style]}>
      <View style={styles.inner}>
        {hasShadow && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.shadow,
              {
                borderRadius: radius,
                opacity: pressed ? 0 : 1,
                transform: [{ translateX: offset }, { translateY: offset }],
              },
            ]}
          />
        )}
        <View
          style={[
            styles.card,
            {
              backgroundColor: TONE_FILL[tone],
              borderRadius: radius,
              borderWidth: thinBorder ? THEME.border.thin : THEME.border.width,
              // Gedrueckt rutscht die Karte genau auf die Stelle ihres Schattens.
              transform: pressed
                ? [{ translateX: offset }, { translateY: offset }]
                : undefined,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Kein overflow: 'hidden' -- der Schatten liegt ausserhalb der Karte.
  root: {},
  // Waechst mit, wenn die Flaeche in einer Reihe auf gleiche Hoehe gezogen
  // wird, bleibt sonst bei ihrer Inhaltshoehe.
  inner: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto' },
  shadow: { backgroundColor: THEME.shadow.color },
  card: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    borderColor: THEME.border.color,
    padding: THEME.spacing.md,
  },
});
