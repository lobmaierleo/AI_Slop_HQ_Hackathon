/**
 * Die Tokens aus DESIGN.md, 1:1 aus app/app/globals.css portiert.
 * Namen bleiben identisch, damit der Abgleich mit DESIGN.md trivial bleibt.
 * Nirgends sonst im Code stehen Hex-Werte oder Pixelmasse.
 */

export const colors = {
  // Marke und Akzent — Action Blue ist der einzige Interaktionsakzent
  primary: "#0066cc",
  primaryFocus: "#0071e3",
  primaryOnDark: "#2997ff",

  // Flächen
  canvas: "#ffffff",
  canvasParchment: "#f5f5f7",
  surfacePearl: "#fafafc",
  surfaceTile1: "#272729",
  surfaceTile2: "#2a2a2c",
  surfaceTile3: "#252527",
  surfaceBlack: "#000000",
  surfaceChipTranslucent: "#d2d2d7",

  // Text
  ink: "#1d1d1f",
  bodyOnDark: "#ffffff",
  bodyMuted: "#cccccc",
  inkMuted80: "#333333",
  inkMuted48: "#7a7a7a",
  onPrimary: "#ffffff",

  // Haarlinien
  dividerSoft: "#f0f0f0",
  hairline: "#e0e0e0",
} as const;

export const radius = {
  xs: 5,
  sm: 8,
  md: 11,
  lg: 18,
  pill: 9999,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 17,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
} as const;

/**
 * Der einzige Schatten im System. Laut DESIGN.md ausschließlich für Bildmaterial,
 * das auf einer Fläche ruht — niemals auf Karten, Buttons oder Text.
 * Steht hier, damit die Regel dokumentiert ist, nicht zur beliebigen Verwendung.
 */
export const shadowProduct = {
  shadowColor: "rgba(0, 0, 0, 0.22)",
  shadowOffset: { width: 3, height: 5 },
  shadowRadius: 30,
  shadowOpacity: 1,
} as const;

/**
 * Datenvisualisierung nach der Auslegung aus app/app/lib.ts (POINT_TONE):
 * Der Akzent gehört der wichtigsten Ebene, alle weiteren Kategorien laufen
 * über die Graustufen des Systems statt über zusätzliche Farbtöne.
 */
export const dataTone = {
  agi: colors.primary,
  water: colors.ink,
  rival: colors.inkMuted80,
  quiet: colors.inkMuted48,
  faint: colors.surfaceChipTranslucent,
} as const;
