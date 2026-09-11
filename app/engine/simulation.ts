import type { Fountain, Lab, Quest } from "./types";
import { fountains as fixtureFountains, meta, questPool, trees } from "./fixtures";

/**
 * Formeln der Simulation, aus docs/spec.md Abschnitt 3:
 *   1 Slop-Token = 0.008 Liter Kühlwasser
 *   AGI-Fortschritt ist asymptotisch — die Pointe ist, dass "AGI" nie erreicht
 *   wird, egal wie viele Tokens verbrannt werden.
 */
const K_AGI = 900_000; // kalibriert auf einen Pitch-Korridor um ~84 % bei ~1.6 Mio Tokens

export function litersFromTokens(tokens: number) {
  return tokens * meta.model.litersPerToken;
}

export function agiProgress(tokens: number) {
  return 99.9 * (1 - Math.exp(-tokens / K_AGI));
}

export function treesFromLiters(liters: number) {
  return Math.floor(liters / trees.litersPerTree);
}

export type FountainState = Fountain & {
  fillLiters: number;
  dry: boolean;
};

/**
 * Verteilt verbrauchte Liter auf die Brunnen in Lastreihenfolge (die
 * Reihenfolge, in der die Pipeline sie nach Projektlast sortiert hat):
 * jeder Brunnen leert sich bis zum Puffer, dann erst der nächste.
 */
export function drainFountains(litersConsumed: number): FountainState[] {
  let remaining = litersConsumed;
  return fixtureFountains.map((f) => {
    const drained = Math.max(0, Math.min(f.bufferLiters, remaining));
    remaining = Math.max(0, remaining - f.bufferLiters);
    const fillLiters = f.bufferLiters - drained;
    return { ...f, fillLiters, dry: fillLiters <= 0 };
  });
}

/** Qualitätsverfall: exponentiell, abhängig vom Lab-Zerfallstempo. */
export function qualityAfterDrops(totalDrop: number, decayRate: number) {
  const q = 100 * Math.exp((-totalDrop * decayRate) / 220);
  return Math.max(0, Math.min(100, q));
}

export function driftLevel(quality: number) {
  return Math.max(0, Math.min(100, 100 - quality));
}

/** Ein Tap zieht die nächste Quest deterministisch aus dem vorberechneten Pool. */
export function questAt(index: number): Quest {
  if (questPool.length === 0) {
    return {
      id: "leer",
      claim: "Kein Trainingsdatensatz geladen.",
      truth: "",
      tokens: 0,
      qualityDrop: 0,
      provenance: {
        street: "", district: "", person: "", wikidata: "", beruf: "", lebens: "",
        project: "", projectLink: "", location: "", fountain: "", distanceM: 0,
      },
    };
  }
  return questPool[index % questPool.length];
}

/** Effektiver Token-Ertrag eines Taps, inklusive der Lab-Mechanik. */
export function tapYield(lab: Lab, tapCount: number, leaderTokens: number): {
  tokens: number;
  blocked: "paywall" | "selflock" | null;
} {
  if (lab.mechanic === "paywall" && lab.paywallEvery && tapCount > 0 && tapCount % lab.paywallEvery === 0) {
    return { tokens: 0, blocked: "paywall" };
  }
  if (lab.mechanic === "selflock" && lab.lockEvery && tapCount > 0 && tapCount % lab.lockEvery === 0) {
    return { tokens: 0, blocked: "selflock" };
  }
  if (lab.mechanic === "distill" && lab.distillFactor) {
    return { tokens: Math.round(Math.max(lab.tapTokens, leaderTokens * lab.distillFactor)), blocked: null };
  }
  return { tokens: lab.tapTokens, blocked: null };
}
