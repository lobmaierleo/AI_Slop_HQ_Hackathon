/**
 * Designsystem von SELBERDENKEN.
 *
 * Die Palette ist die Dunkelhaelfte des verbindlichen DESIGN.md: schwarzer
 * Grund, drei Tile-Toene, genau ein Akzent (Sky Link Blue). Auf Schwarz ist
 * dieser Blauton exakt die Farbe, in der die Synapsen leuchten -- Akzent und
 * Kernbild der App sind dasselbe.
 *
 * Darueber liegt eine Glasschicht (siehe components/GlassSurface): Blur,
 * Spekularkante, Glow. Das ist die einzige bewusste Abweichung von DESIGN.md,
 * das auf hellen Flaechen flache randlose Tiles vorschreibt.
 */

const colors = {
  /** Grund. Schwarz, nicht dunkelgrau -- OLED zieht die Synapsen sonst zu. */
  background: '#000000',
  /** Tile-Leiter aus DESIGN.md. 1 traegt Karten, 2 Hervorhebungen, 3 Vertiefungen. */
  tile: '#272729',
  tileRaised: '#2a2a2c',
  tileSunken: '#252527',

  text: '#ffffff',
  textMuted: '#cccccc',
  /** Fuer Beschriftungen, die nur bei Bedarf gelesen werden. */
  textFaint: '#8a8a8e',

  /** Der einzige Akzent. Es gibt keinen zweiten. */
  primary: '#2997ff',
  /** Derselbe Akzent als Flaeche hinter Text. */
  primarySoft: 'rgba(41, 151, 255, 0.16)',
  /** Halo um leuchtende Knoten und Synapsen. */
  primaryGlow: 'rgba(41, 151, 255, 0.45)',
  onAccent: '#ffffff',

  /** Zustandsfarben. Sparsam und nur dort, wo Richtig/Falsch gemeint ist. */
  success: '#30d158',
  error: '#ff453a',

  hairline: 'rgba(255, 255, 255, 0.12)',
  track: 'rgba(255, 255, 255, 0.08)',
  /** Nebel des Unwissens auf der Karte. */
  fog: 'rgba(5, 6, 10, 0.82)',
} as const;

/** Material-Werte der Glasschicht. Wird ausschliesslich von GlassSurface gelesen. */
const glass = {
  tint: 'systemUltraThinMaterialDark' as const,
  intensity: 44,
  /** Unterbau, falls der Blur nicht greift. */
  fill: 'rgba(30, 30, 34, 0.55)',
  border: 'rgba(255, 255, 255, 0.14)',
  /** Spekularstreif: hell oben, verlaeuft nach unten ins Nichts. */
  specular: ['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0)'] as const,
  specularLocations: [0, 0.35, 1] as const,
} as const;

/**
 * Typo nach DESIGN.md: Fliesstext 17px bei Zeilenhoehe 1.47, negative
 * Laufweite ab 17px, und die Gewichtsleiter 300/400/600/700 -- 500 existiert
 * in diesem System nicht.
 */
const type = {
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 1.6, lineHeight: 16 },
  display: { fontSize: 40, fontWeight: '700', letterSpacing: -1.2, lineHeight: 44 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6, lineHeight: 33 },
  heading: { fontSize: 21, fontWeight: '600', letterSpacing: -0.3, lineHeight: 26 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.2, lineHeight: 25 },
  bodyStrong: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 25 },
  caption: { fontSize: 14, fontWeight: '400', letterSpacing: 0, lineHeight: 19 },
  /** Grosse Kennzahlen. Tabellenziffern, damit hochzaehlende Werte nicht zappeln. */
  metric: { fontSize: 34, fontWeight: '700', letterSpacing: -1, lineHeight: 38 },
} as const;

export const THEME = {
  colors,
  glass,
  type,
  radius: { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
  /** Freiraum unter scrollenden Inhalten, damit die Glasleiste nichts verdeckt. */
  tabBarClearance: 120,
} as const;

export type Theme = typeof THEME;
