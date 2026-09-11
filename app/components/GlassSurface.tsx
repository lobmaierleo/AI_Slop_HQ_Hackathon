import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { THEME } from '@/theme/colors';

type Props = {
  children?: React.ReactNode;
  /** Eckenradius. Der Blur wird darauf beschnitten. */
  radius?: number;
  /** Blur-Staerke. Hoeher heisst milchiger, nicht dunkler. */
  intensity?: number;
  /** Legt eine Akzentkante plus Schein um die Flaeche -- fuer aktive Zustaende. */
  glow?: boolean;
  /** Blendet den Spekularstreif aus, z. B. bei sehr flachen Leisten. */
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Die eine Glasflaeche der App. Jede Karte, Leiste und Pille baut darauf auf.
 *
 * Drei Schichten uebereinander: der Blur nimmt auf, was darunter liegt, ein
 * Fuellton stabilisiert ihn gegen zu dunkle Hintergruende, und ein
 * Spekularstreif von oben gibt der Flaeche eine Kante, an der sich Licht
 * bricht. Erst diese dritte Schicht laesst das Material wie Glas wirken und
 * nicht wie Milchfolie.
 */
export function GlassSurface({
  children,
  radius = THEME.radius.lg,
  intensity = THEME.glass.intensity,
  glow = false,
  flat = false,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.root, { borderRadius: radius }, glow && styles.glow, style]}>
      <BlurView
        intensity={intensity}
        tint={THEME.glass.tint}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={[StyleSheet.absoluteFill, styles.fill, { borderRadius: radius }]} />
      {!flat && (
        <LinearGradient
          colors={THEME.glass.specular}
          locations={THEME.glass.specularLocations}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.border,
          { borderRadius: radius, borderColor: glow ? THEME.colors.primary : THEME.glass.border },
        ]}
        pointerEvents="none"
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    // Ohne eigenen Grund schimmert auf Schwarz nichts durch, was der Blur
    // aufnehmen koennte -- die Flaeche bliebe unsichtbar.
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  fill: { backgroundColor: THEME.glass.fill },
  border: { borderWidth: StyleSheet.hairlineWidth * 2 },
  content: { padding: THEME.spacing.md },
  glow: {
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
});
