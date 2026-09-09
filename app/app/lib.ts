// Zugriff auf die von scripts/build_app_data.py erzeugten Dateien in public/data/.
// Rohdaten liegen in ../data/ und gehoeren nicht in den Browser.

export type FestivalLocation = {
  id: string; name: string; area: string | null; type: string | null;
  address: string | null; lat: number; lon: number;
};
export type FestivalProject = {
  id: string; nameEn: string | null; nameDe: string | null; category: string | null;
  artists: string | null; highlight: boolean; language: string | null;
  ticket: string | null; descEn: string; url: string | null;
};
export type LinzPoint = {
  kind: "trinkbrunnen" | "wc" | "defibrillator" | "hecke" | "wlan";
  lat: number; lon: number; name?: string; [k: string]: unknown;
};
export type LinzStreet = {
  name: string; kg: string | null; person: string | null;
  gender: "male" | "female" | null; job: string | null; wikidata: string | null;
};
export type Country = { iso2: string; name: string; count: number };

async function load<T>(file: string): Promise<T> {
  const res = await fetch(`/data/${file}`);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getLocations = () => load<FestivalLocation[]>("festival-locations.json");
export const getProjects = () => load<FestivalProject[]>("festival-projects.json");
export const getCountries = () => load<Country[]>("festival-countries.json");
export const getLinzPoints = () => load<LinzPoint[]>("linz-points.json");
export const getStreets = () => load<LinzStreet[]>("linz-streets.json");

export const LINZ_CENTER: [number, number] = [14.2858, 48.3069];

/**
 * Farbgebung der Kartenpunkte nach DESIGN.md.
 *
 * Action Blue bleibt der einzige Akzent und gehoert den Festivalorten — sie sind
 * das "Produkt" dieser Karte. Die Linzer Datensaetze sind Kontext und laufen
 * deshalb ueber die Graustufen des Systems, unterschieden durch Helligkeit
 * statt durch einen zweiten Farbton.
 */
export const POINT_TONE = {
  festival: "#0066cc",      // colors.primary
  trinkbrunnen: "#1d1d1f",  // colors.ink
  wc: "#333333",            // colors.ink-muted-80
  defibrillator: "#7a7a7a", // colors.ink-muted-48
  hecke: "#a1a1a6",         // Zwischenstufe der Ink-Reihe
  wlan: "#d2d2d7",          // colors.surface-chip-translucent
} as const;

export const POINT_LABEL: Record<keyof typeof POINT_TONE, string> = {
  festival: "Festivalorte",
  trinkbrunnen: "Trinkbrunnen",
  wc: "WC-Anlagen",
  defibrillator: "Defibrillatoren",
  hecke: "Essbare Hecken",
  wlan: "WLAN-Hotspots",
};

/**
 * Heller, entsaettigter Kartenhintergrund. Die bunte OSM-Standardkachel wuerde
 * mit dem einen Akzent konkurrieren; nach DESIGN.md tritt die Flaeche zurueck,
 * damit die Daten sprechen koennen.
 */
export const MAP_STYLE = {
  version: 8 as const,
  sources: {
    positron: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [{ id: "positron", type: "raster" as const, source: "positron" }],
};
