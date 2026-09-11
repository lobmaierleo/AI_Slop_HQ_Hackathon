import { THEME, type CategoryKey } from '@/theme/colors';

/**
 * Die fuenf Knotenarten, einmal zentral.
 *
 * Form und Farbe zusammen: Wer Farben schlecht unterscheidet, liest die Form,
 * und auf der Karte wie im Netz steht dieselbe Art fuer dieselbe Sache.
 */
export type NodeShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';

export const CATEGORY_META: Record<
  CategoryKey,
  { label: string; shape: NodeShape; color: string }
> = {
  water: { label: 'Trinkwasser', shape: 'circle', color: THEME.category.water },
  tree: { label: 'Baumkataster', shape: 'square', color: THEME.category.tree },
  venue: { label: 'Spielort', shape: 'triangle', color: THEME.category.venue },
  power: { label: 'Notfallnetz', shape: 'diamond', color: THEME.category.power },
  wifi: { label: 'Freies WLAN', shape: 'hexagon', color: THEME.category.wifi },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_META) as CategoryKey[];

/** Unbekannte Typen landen bei `venue` statt zu crashen. */
export function categoryOf(type: string): CategoryKey {
  return (type in CATEGORY_META ? type : 'venue') as CategoryKey;
}

/**
 * Eckpunkte einer Form als SVG-`points`, zentriert auf (cx, cy).
 * `circle` hat keine Punkte und wird von den Aufrufstellen gesondert gezeichnet.
 */
export function shapePoints(shape: NodeShape, cx: number, cy: number, r: number): string {
  const pts: [number, number][] = [];
  if (shape === 'square') {
    const a = r * 0.86;
    pts.push([cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]);
  } else if (shape === 'triangle') {
    // Etwas nach unten geschoben, sonst sitzt das Dreieck optisch zu hoch.
    const a = r * 1.15;
    pts.push([cx, cy - a], [cx + a * 0.92, cy + a * 0.62], [cx - a * 0.92, cy + a * 0.62]);
  } else if (shape === 'diamond') {
    const a = r * 1.12;
    pts.push([cx, cy - a], [cx + a, cy], [cx, cy + a], [cx - a, cy]);
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
  }
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

/** Kurzform eines Quest-Titels: alles vor dem Komma, sonst hart gekuerzt. */
export function shortLabel(title: string): string {
  const comma = title.indexOf(',');
  const base = comma > 0 ? title.slice(0, comma) : title;
  return base.length > 16 ? `${base.slice(0, 15)}…` : base;
}
