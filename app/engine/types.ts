export type LabId = "closedai" | "antithropic" | "grek" | "shallowseek";

export type Lab = {
  id: LabId;
  name: string;
  slogan: string;
  tone: string;
  malus: string;
  mechanic: "paywall" | "selflock" | "unhinged" | "distill";
  tapTokens: number;
  decayRate: number;
  driftThreshold: number;
  paywallEvery?: number;
  lockEvery?: number;
  distillFactor?: number;
};

export type FountainNode = {
  locId: string;
  name: string;
  area: string;
  projects: number;
  distanceM: number;
};

export type Fountain = {
  id: string;
  name: string;
  kind: string;
  build: string;
  lat: number;
  lon: number;
  bufferLiters: number;
  basinLiters: number | null;
  totalProjects: number;
  nodes: FountainNode[];
};

export type Provenance = {
  street: string;
  district: string;
  person: string;
  wikidata: string;
  beruf: string;
  lebens: string;
  project: string;
  projectLink: string;
  location: string;
  fountain: string;
  distanceM: number;
};

export type Quest = {
  id: string;
  claim: string;
  truth: string;
  tokens: number;
  qualityDrop: number;
  provenance: Provenance;
};

export type Pair = {
  id: string;
  real: { text: string; project: string; link: string; location: string };
  slop: { text: string; questId: string; truth: string };
  realFirst: boolean;
};

export type Fixtures = {
  meta: {
    generatedAt: string;
    seed: number;
    festivalExport: string;
    counts: Record<string, number>;
    model: {
      litersPerToken: number;
      fountainBufferLiters: number;
      litersPerTree: number;
      co2PerTreeKg: number;
      note: string;
      vintage: string;
    };
  };
  labs: Lab[];
  fountains: Fountain[];
  questPool: Quest[];
  pairs: Pair[];
  drift: { from: string; to: string }[];
  trees: {
    total: number;
    nearHauptplatz300m: number;
    topSpecies: { name: string; count: number }[];
    litersPerTree: number;
    co2PerTreeKg: number;
  };
  chatter: Record<LabId, string[]>;
};
