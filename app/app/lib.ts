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

/** Freier Rasterhintergrund ohne API-Key. */
export const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};
