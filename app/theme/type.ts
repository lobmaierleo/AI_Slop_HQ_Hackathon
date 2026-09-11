import { Platform, TextStyle } from "react-native";
import { colors } from "./tokens";

/**
 * Auf iOS ist fontFamily: undefined die echte San Francisco. Deshalb kein expo-font.
 * Auf Web und Android setzen wir den Stack aus DESIGN.md.
 */
const family = Platform.select({
  ios: undefined,
  default: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
});

const preset = (
  fontSize: number,
  lineHeightFactor: number,
  letterSpacing: number,
  fontWeight: TextStyle["fontWeight"],
): TextStyle => ({
  fontFamily: family,
  fontSize,
  lineHeight: Math.round(fontSize * lineHeightFactor),
  letterSpacing,
  fontWeight,
  color: colors.ink,
});

/**
 * Die Typo-Stufen aus DESIGN.md. Die Gewichtsleiter ist 300 / 400 / 600 / 700 —
 * Gewicht 500 existiert im System nicht.
 */
export const type = {
  heroDisplay: preset(56, 1.07, -0.28, "600"),
  displayLg: preset(40, 1.1, 0, "600"),
  displayMd: preset(34, 1.47, -0.374, "600"),
  lead: preset(28, 1.14, 0.196, "400"),
  leadAiry: preset(24, 1.5, 0, "300"),
  tagline: preset(21, 1.19, 0.231, "600"),
  bodyStrong: preset(17, 1.24, -0.374, "600"),
  body: preset(17, 1.47, -0.374, "400"),
  caption: preset(14, 1.43, -0.224, "400"),
  captionStrong: preset(14, 1.29, -0.224, "600"),
  buttonLarge: preset(18, 1, 0, "300"),
  buttonUtility: preset(14, 1.29, -0.224, "400"),
  finePrint: preset(12, 1, -0.12, "400"),
  microLegal: preset(10, 1.3, -0.08, "400"),
} as const;

/** Große Zahlen brauchen gleiche Ziffernbreiten, sonst zappelt der Zähler. */
export const tabular: TextStyle = {
  fontVariant: ["tabular-nums"],
};
