import type { LabId } from "./types";
import { LAB_IDS } from "./fixtures";

/**
 * Alle Lesezugriffe auf den Rennstand laufen über diese Quelle. Heute rechnet
 * sie lokal. Ein geteilter Stand über mehrere Geräte lässt sich nachziehen,
 * ohne einen einzigen Screen anzufassen: neue Implementierung, gleiche Form.
 */
export interface LeaderboardSource {
  readonly kind: "local" | "remote";
  init(seed: number): void;
  /** Liefert den Tokenstand aller Labs inklusive des eigenen. */
  tick(dtMs: number, playerLab: LabId, playerTokens: number): Record<LabId, number>;
  /** Lokal ein No-op. Eine Remote-Quelle schickt hier den eigenen Stand hoch. */
  publish?(playerLab: LabId, playerTokens: number): void;
}

/** Kleiner deterministischer PRNG, damit jede Demo gleich verläuft. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grundtempo der Rivalen in Tokens pro Sekunde. */
const BASE_RATE: Record<LabId, number> = {
  closedai: 2600,
  antithropic: 1500,
  grek: 3400,
  shallowseek: 0, // koppelt an den Führenden
};

class SeededLocalSource implements LeaderboardSource {
  readonly kind = "local" as const;
  private rand = mulberry(1);
  private tokens: Record<LabId, number> = { closedai: 0, antithropic: 0, grek: 0, shallowseek: 0 };
  private jitter: Record<LabId, number> = { closedai: 1, antithropic: 1, grek: 1, shallowseek: 1 };

  init(seed: number) {
    this.rand = mulberry(seed);
    for (const id of LAB_IDS) {
      // Leichter Vorsprung, damit das Rennen nicht bei null beginnt
      this.tokens[id] = Math.round(40000 + this.rand() * 60000);
      this.jitter[id] = 1;
    }
  }

  tick(dtMs: number, playerLab: LabId, playerTokens: number) {
    const dt = Math.min(dtMs, 2000) / 1000;

    for (const id of LAB_IDS) {
      if (id === playerLab) continue;
      // Das Tempo schwankt langsam, damit Ränge auch mal kippen
      this.jitter[id] += (this.rand() - 0.5) * 0.22;
      this.jitter[id] = Math.max(0.55, Math.min(1.6, this.jitter[id]));
      this.tokens[id] += BASE_RATE[id] * this.jitter[id] * dt;
    }

    this.tokens[playerLab] = playerTokens;

    // ShallowSeek destilliert: die Hälfte der Rate des Führenden, nie vorne
    if (playerLab !== "shallowseek") {
      const leader = Math.max(
        ...LAB_IDS.filter((i) => i !== "shallowseek").map((i) => this.tokens[i]),
      );
      const target = leader * 0.88;
      this.tokens.shallowseek += (target - this.tokens.shallowseek) * Math.min(1, dt * 0.6);
    }

    return { ...this.tokens };
  }

  publish() {
    // Lokal gibt es nichts zu veröffentlichen.
  }
}

export const leaderboardSource: LeaderboardSource = new SeededLocalSource();

export function ranked(tokens: Record<LabId, number>) {
  return LAB_IDS.slice()
    .sort((a, b) => tokens[b] - tokens[a])
    .map((id, i) => ({ id, rank: i + 1, tokens: tokens[id] }));
}
