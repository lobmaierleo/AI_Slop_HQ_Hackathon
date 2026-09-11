import board from '@/data/leaderboard.json';

/**
 * Die Wasser-Rangliste.
 *
 * Die Mitspielenden sind erfunden, ihre Werte fest -- kein `Math.random()`,
 * damit die Rangliste im Pitch zweimal hintereinander dasselbe zeigt. Die
 * eigene Zeile kommt aus dem echten Spielstand und wandert nach oben, sobald
 * eine Quest abgeschlossen ist.
 */

export type LeaderboardEntry = {
  id: string;
  name: string;
  hint: string;
  waterLiters: number;
  isPlayer: boolean;
};

const RIVALS = board.rivals as Omit<LeaderboardEntry, 'isPlayer'>[];

/** Feste Id der eigenen Zeile, damit ihre Animation ueber Rangwechsel haelt. */
export const PLAYER_ID = 'player';

/** Alle Zeilen in fester Reihenfolge -- die Grundlage fuer stabile Animationswerte. */
export const LEADERBOARD_IDS: string[] = [PLAYER_ID, ...RIVALS.map((r) => r.id)];

/**
 * Mischt die eigene Zeile unter die Mitspielenden und sortiert nach Litern.
 * Bei Gleichstand liegt die eigene Zeile vorn -- wer gerade aufgeschlossen hat,
 * soll den Platzgewinn auch sehen.
 */
export function rankByWater(playerLiters: number): LeaderboardEntry[] {
  const rows: LeaderboardEntry[] = [
    { id: PLAYER_ID, name: 'Du', hint: 'dein Netz', waterLiters: playerLiters, isPlayer: true },
    ...RIVALS.map((r) => ({ ...r, isPlayer: false })),
  ];
  return rows.sort((a, b) => {
    if (b.waterLiters !== a.waterLiters) return b.waterLiters - a.waterLiters;
    return Number(b.isPlayer) - Number(a.isPlayer);
  });
}

/** Groesster Wert der Liste -- Bezugsgroesse fuer die Balkenbreite. */
export function topWater(entries: readonly LeaderboardEntry[]): number {
  return entries.reduce((max, e) => Math.max(max, e.waterLiters), 0);
}

/** Deutsche Schreibweise mit Komma. */
export function formatLiters(liters: number): string {
  return liters.toFixed(1).replace('.', ',');
}
