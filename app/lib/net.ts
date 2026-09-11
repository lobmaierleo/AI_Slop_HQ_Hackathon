import graph from '@/data/graph.json';

/**
 * Das Synapsen-Netz und seine Rechenregeln.
 *
 * Positionen und Kanten sind in scripts/build_graph.py vorberechnet. Hier
 * steht nur, was sich mit dem Spielfortschritt aendert.
 */

export type GraphNode = { id: string; type: string; x: number; y: number };
export type GraphEdge = { a: string; b: string; kind: 'theme' | 'space' };

export const NODES = graph.nodes as GraphNode[];
export const EDGES = graph.edges as GraphEdge[];

/**
 * Kuehlwasser, das eine einzelne LLM-Abfrage im Rechenzentrum verdampft.
 * Die Zahl traegt den ganzen Pitch, deshalb steht sie an genau einer Stelle.
 */
export const LITERS_PER_QUERY = 0.5;

/** Eine Synapse leuchtet erst, wenn beide Enden entdeckt sind. */
export function activeEdges(completedIds: readonly string[]): GraphEdge[] {
  const found = new Set(completedIds);
  return EDGES.filter((e) => found.has(e.a) && found.has(e.b));
}

export function queriesAvoided(liters: number): number {
  return Math.round(liters / LITERS_PER_QUERY);
}

/** Luftlinie in Metern. Gleiche Formel wie in den Build-Skripten. */
export function meters(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const rad = Math.PI / 180;
  const p1 = latA * rad;
  const p2 = latB * rad;
  const dp = p2 - p1;
  const dl = (lonB - lonA) * rad;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Distanz lesbar machen: unter einem Kilometer in Metern, darueber gerundet. */
export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
