import { useEffect, useMemo, useRef, useState } from 'react';

import { TEAMS } from '@/state/useGameStore';
import type { Team, TeamId } from '@/state/useGameStore';

export type LeaderboardEntry = {
  team: Team;
  isPlayer: boolean;
  agiProgress: number;
  waterLiters: number;
};

type SimState = { agiProgress: number; waterLiters: number };

/** Gleiche Decke wie im Store: AGI bleibt für alle Labore knapp ausser Reichweite. */
const AGI_CEILING = 99.4;

/** Ein Tick alle 1–2 Sekunden — die Zahlen sollen laufen, nicht springen. */
const TICK_MS = 1500;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function approach(current: number, step: number) {
  return Math.min(AGI_CEILING, current + (AGI_CEILING - current) * step);
}

type RivalProfile = {
  startAgi: number;
  startWater: number;
  /** Fortschritts-Schritt (als Anteil der Restdistanz zur Decke) pro Tick. */
  agiStep: (tick: number) => number;
  /** Wasserverbrauch pro Tick in Litern. */
  waterStep: () => number;
};

/**
 * Drei erkennbare Charaktere fürs Rennen:
 * - ClosedAI zieht früh davon und stagniert dann (Blackbox verbrennt sich selbst).
 * - Antithropic startet zögerlich (Alignment-Reviews) und holt spät kräftig auf.
 * - Grek ist erratisch: grosse Sprünge, dann wieder Nullrunden.
 * ShallowSeek kopiert die anderen und wächst dafür unauffällig gleichmässig —
 * das vierte Lab, falls es nicht vom Spieler gewählt wurde.
 */
const PROFILES: Record<TeamId, RivalProfile> = {
  closedai: {
    startAgi: 71,
    startWater: 31,
    agiStep: (tick) => Math.max(0.002, 0.05 * Math.exp(-tick / 12)),
    waterStep: () => rand(0.15, 0.35),
  },
  antithropic: {
    startAgi: 59,
    startWater: 17,
    agiStep: (tick) => 0.006 + 0.055 * Math.min(1, tick / 26),
    waterStep: () => rand(0.1, 0.22),
  },
  grek: {
    startAgi: 54,
    startWater: 23,
    agiStep: () => Math.max(0, rand(-0.015, 0.095)),
    waterStep: () => rand(0.05, 0.65),
  },
  shallowseek: {
    startAgi: 60,
    startWater: 20,
    agiStep: () => rand(0.017, 0.03),
    waterStep: () => rand(0.12, 0.28),
  },
};

function initRivals(): Record<TeamId, SimState> {
  const state = {} as Record<TeamId, SimState>;
  (Object.keys(PROFILES) as TeamId[]).forEach((id) => {
    state[id] = { agiProgress: PROFILES[id].startAgi, waterLiters: PROFILES[id].startWater };
  });
  return state;
}

/**
 * Simuliert die drei Rivalen-Labore, die nicht vom Spieler gesteuert werden, und
 * mischt sie mit den echten Store-Werten des eigenen Labs zu einer nach
 * AGI-Fortschritt sortierten Rangliste. Tickt alle `TICK_MS` per `setInterval`,
 * räumt beim Unmount auf und hält ausserhalb des State-Updates keine sich
 * ständig neu bildenden Abhängigkeiten — das Interval wird genau einmal gesetzt.
 */
export function useLeaderboard(
  playerTeamId: TeamId | null,
  playerAgiProgress: number,
  playerWaterLiters: number,
): LeaderboardEntry[] {
  const [rivals, setRivals] = useState<Record<TeamId, SimState>>(initRivals);
  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setRivals((prev) => {
        const next = {} as Record<TeamId, SimState>;
        (Object.keys(PROFILES) as TeamId[]).forEach((teamId) => {
          const profile = PROFILES[teamId];
          const current = prev[teamId];
          next[teamId] = {
            agiProgress: approach(current.agiProgress, profile.agiStep(tick)),
            waterLiters: current.waterLiters + profile.waterStep(),
          };
        });
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const entries: LeaderboardEntry[] = TEAMS.map((team) => {
      if (team.id === playerTeamId) {
        return {
          team,
          isPlayer: true,
          agiProgress: playerAgiProgress,
          waterLiters: playerWaterLiters,
        };
      }
      const sim = rivals[team.id];
      return { team, isPlayer: false, agiProgress: sim.agiProgress, waterLiters: sim.waterLiters };
    });
    return entries.sort((a, b) => b.agiProgress - a.agiProgress);
  }, [rivals, playerTeamId, playerAgiProgress, playerWaterLiters]);
}
