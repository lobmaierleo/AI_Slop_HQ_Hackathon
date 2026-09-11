/**
 * Designsystem von SELBERDENKEN.
 *
 * Neobrutalismus: cremefarbener Grund, weisse Karten, dicke schwarze Rahmen und
 * harte Versatzschatten ohne jede Weichzeichnung. Tiefe entsteht hier nicht aus
 * Licht, sondern aus Kante und Versatz -- eine Flaeche liegt sichtbar auf einer
 * anderen, so wie ein Aufkleber auf Papier.
 *
 * Das ist die dokumentierte Abweichung von DESIGN.md, das ein Apple-System mit
 * genau einem Akzent und ausdruecklich ohne Schatten auf Karten beschreibt.
 * Der Abschnitt "Override: SELBERDENKEN Neobrutalismus" in DESIGN.md haelt
 * fest, welche Regeln aufgehoben sind und welche unveraendert gelten.
 */

const colors = {
  /** Der Grund. Creme, nicht Weiss -- sonst verschwinden die weissen Karten. */
  background: '#FDF6E3',
  /** Karten und Leisten. */
  surface: '#FFFFFF',
  /** Vertiefungen: Fortschrittsbalken, leere Segmente, Trackflaechen. */
  surfaceSunken: '#F4EAD2',

  /** Rahmen und Schatten. Immer dieselbe Farbe, nie eine abgeschwaechte. */
  ink: '#000000',

  text: '#000000',
  textMuted: '#3A3A3A',
  /** Fuer Beschriftungen, die nur bei Bedarf gelesen werden. */
  textFaint: '#6B6B6B',

  /** Gelb traegt jede Aktion: Buttons, aktiver Tab, eigene Rangzeile. */
  primary: '#FFD100',
  secondary: '#FF5FA2',
  tertiary: '#22D3EE',

  /** Zustandsfarben. Nur dort, wo Richtig/Falsch gemeint ist. */
  success: '#5BE37D',
  error: '#FF5C4D',

  /** Schrift auf Signalflaechen ist schwarz. Weiss auf Gelb ist unlesbar. */
  onSignal: '#000000',
} as const;

/**
 * Kategorie-Palette der Datenvisualisierung: die fuenf Knotentypen aus
 * data/graph.json. Fuenf Kategorien lassen sich nicht ueber Graustufen
 * trennen, deshalb hier die einzige Stelle mit mehr als drei Farben.
 * Im Graph traegt zusaetzlich die Form dieselbe Information -- wer Farben
 * schlecht unterscheidet, liest die Kategorie an Kreis, Quadrat, Dreieck,
 * Raute und Sechseck ab.
 */
const category = {
  water: '#22D3EE',
  tree: '#A3E635',
  venue: '#FF5FA2',
  power: '#FFD100',
  wifi: '#A78BFA',
} as const;

export type CategoryKey = keyof typeof category;

/** Rahmen. `width` fuer Karten, `thin` fuer Elemente unter 40px Hoehe. */
const border = {
  width: 3,
  thin: 2,
  color: colors.ink,
} as const;

/**
 * Harter Versatzschatten. Kein Radius, keine Deckkraft -- eine schwarze
 * Flaeche, die um `offset` nach rechts unten herausschaut. Wird als
 * Geschwister-View gezeichnet, nicht als Style-Prop: Android kann ueber
 * `elevation` keinen Schatten ohne Weichzeichnung erzeugen.
 */
const shadow = {
  offset: 6,
  offsetSm: 4,
  color: colors.ink,
} as const;

/**
 * Typo. Fliesstext bleibt 17px bei Zeilenhoehe 25 -- diese Regel aus
 * DESIGN.md gilt unveraendert. Die Gewichtsleiter reicht hier bis 800, weil
 * dieser Stil ohne Masse nicht funktioniert. 500 existiert weiterhin nicht.
 */
const type = {
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6, lineHeight: 16 },
  display: { fontSize: 40, fontWeight: '800', letterSpacing: -1.2, lineHeight: 44 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 },
  heading: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3, lineHeight: 26 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.2, lineHeight: 25 },
  bodyStrong: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 25 },
  caption: { fontSize: 14, fontWeight: '400', letterSpacing: 0, lineHeight: 19 },
  captionStrong: { fontSize: 14, fontWeight: '600', letterSpacing: 0, lineHeight: 19 },
  /** Grosse Kennzahlen. Tabellenziffern, damit hochzaehlende Werte nicht zappeln. */
  metric: { fontSize: 40, fontWeight: '800', letterSpacing: -1.4, lineHeight: 44 },
} as const;

export const THEME = {
  colors,
  category,
  border,
  shadow,
  type,
  /** Flache Radien. Neobrutalismus rundet knapp, nicht weich. */
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, pill: 999 },
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 },
  /** Freiraum unter scrollenden Inhalten, damit die Tableiste nichts verdeckt. */
  tabBarClearance: 120,
} as const;

export type Theme = typeof THEME;
