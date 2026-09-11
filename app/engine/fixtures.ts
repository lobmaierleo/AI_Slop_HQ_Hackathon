import raw from "@/assets/data/slop_fixtures.json";
import type { Fixtures, Lab, LabId } from "./types";

/**
 * Statischer Import: Metro backt die Fixture in das Bundle. Zur Laufzeit
 * gibt es keinen Netzaufruf — das WLAN vor Ort ist ein Risiko und ein
 * LLM-Call im Demo-Pfad ist ausgeschlossen.
 *
 * Die Formprüfung ist Absicht: sollte die Pipeline je etwas anderes liefern,
 * startet die App trotzdem und zeigt leere Listen statt eines weißen Bildes.
 */
const empty: Fixtures = {
  meta: {
    generatedAt: "",
    seed: 0,
    festivalExport: "",
    counts: {},
    model: {
      litersPerToken: 0.008,
      fountainBufferLiters: 2000,
      litersPerTree: 250,
      co2PerTreeKg: 22,
      note: "",
      vintage: "",
    },
  },
  labs: [],
  fountains: [],
  questPool: [],
  pairs: [],
  drift: [],
  trees: { total: 0, nearHauptplatz300m: 0, topSpecies: [], litersPerTree: 250, co2PerTreeKg: 22 },
  chatter: { closedai: [], antithropic: [], grek: [], shallowseek: [] },
};

function shaped(): Fixtures {
  const f = raw as unknown as Partial<Fixtures>;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  return {
    meta: f.meta ?? empty.meta,
    labs: arr(f.labs, empty.labs),
    fountains: arr(f.fountains, empty.fountains),
    questPool: arr(f.questPool, empty.questPool),
    pairs: arr(f.pairs, empty.pairs),
    drift: arr(f.drift, empty.drift),
    trees: f.trees ?? empty.trees,
    chatter: f.chatter ?? empty.chatter,
  };
}

export const fixtures = shaped();

export const { labs, fountains, questPool, pairs, drift, trees, chatter, meta } = fixtures;

export const labById = (id: LabId): Lab =>
  labs.find((l) => l.id === id) ?? {
    id,
    name: id,
    slogan: "",
    tone: "",
    malus: "",
    mechanic: "unhinged",
    tapTokens: 1000,
    decayRate: 1,
    driftThreshold: 70,
  };

export const LAB_IDS: LabId[] = ["closedai", "antithropic", "grek", "shallowseek"];
