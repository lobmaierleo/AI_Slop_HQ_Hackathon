import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { LabId } from "./types";
import { labById, questPool } from "./fixtures";
import {
  agiProgress,
  driftLevel,
  drainFountains,
  litersFromTokens,
  qualityAfterDrops,
  questAt,
  tapYield,
  treesFromLiters,
  type FountainState,
} from "./simulation";
import { leaderboardSource, ranked } from "./leaderboard";
import { notify } from "@/components/PressableScale";

export type SlopEvent = {
  id: string;
  at: number;
  kind: "fountain-dry" | "overtaken" | "paywall" | "selflock" | "collapse";
  text: string;
};

type State = {
  lab: LabId | null;
  tapCount: number;
  tokens: number;
  totalQualityDrop: number;
  rivals: Record<LabId, number>;
  paused: boolean;
  pauseReason: "selflock" | null;
  paywallOpen: boolean;
  questIndex: number;
  events: SlopEvent[];
  presentation: boolean;
};

type Action =
  | { type: "join"; lab: LabId }
  | { type: "tap" }
  | { type: "dismissPaywall" }
  | { type: "resume" }
  | { type: "tick"; rivals: Record<LabId, number> }
  | { type: "log"; event: SlopEvent }
  | { type: "setPresentation"; value: boolean }
  | { type: "collapse" }
  | { type: "reset" };

const initial: State = {
  lab: null,
  tapCount: 0,
  tokens: 0,
  totalQualityDrop: 0,
  rivals: { closedai: 0, antithropic: 0, grek: 0, shallowseek: 0 },
  paused: false,
  pauseReason: null,
  paywallOpen: false,
  questIndex: 0,
  events: [],
  presentation: false,
};

function pushEvent(events: SlopEvent[], event: SlopEvent) {
  return [event, ...events].slice(0, 40);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "join":
      return { ...initial, lab: action.lab, rivals: state.rivals };

    case "tap": {
      if (!state.lab || state.paused || state.paywallOpen) return state;
      const lab = labById(state.lab);
      const leader = Math.max(0, ...Object.values(state.rivals));
      const { tokens, blocked } = tapYield(lab, state.tapCount + 1, leader);

      if (blocked === "paywall") {
        return {
          ...state,
          tapCount: state.tapCount + 1,
          paywallOpen: true,
          events: pushEvent(state.events, {
            id: `ev-${Date.now()}`,
            at: Date.now(),
            kind: "paywall",
            text: "Enterprise-Subscription erforderlich, um fortzufahren.",
          }),
        };
      }
      if (blocked === "selflock") {
        return {
          ...state,
          tapCount: state.tapCount + 1,
          paused: true,
          pauseReason: "selflock",
          events: pushEvent(state.events, {
            id: `ev-${Date.now()}`,
            at: Date.now(),
            kind: "selflock",
            text: "Aus Sicherheitsgründen pausiert.",
          }),
        };
      }

      const quest = questAt(state.questIndex);
      return {
        ...state,
        tapCount: state.tapCount + 1,
        tokens: state.tokens + tokens,
        totalQualityDrop: state.totalQualityDrop + quest.qualityDrop,
        questIndex: state.questIndex + 1,
      };
    }

    case "dismissPaywall":
      return { ...state, paywallOpen: false };

    case "resume":
      return { ...state, paused: false, pauseReason: null };

    case "tick":
      return { ...state, rivals: action.rivals };

    case "log":
      return { ...state, events: pushEvent(state.events, action.event) };

    case "setPresentation":
      return { ...state, presentation: action.value };

    case "collapse":
      return {
        ...state,
        totalQualityDrop: state.totalQualityDrop + 400,
        events: pushEvent(state.events, {
          id: `ev-${Date.now()}`,
          at: Date.now(),
          kind: "collapse",
          text: "Model Collapse ausgelöst. Der Kontext kippt vollständig.",
        }),
      };

    case "reset":
      return { ...initial, rivals: state.rivals };

    default:
      return state;
  }
}

type Ctx = {
  state: State;
  fountains: FountainState[];
  liters: number;
  agi: number;
  quality: number;
  drift: number;
  trees: number;
  standings: ReturnType<typeof ranked>;
  currentQuest: ReturnType<typeof questAt>;
  join: (lab: LabId) => void;
  tap: () => void;
  dismissPaywall: () => void;
  resume: () => void;
  setPresentation: (v: boolean) => void;
  triggerCollapse: () => void;
  reset: () => void;
};

const SlopContext = createContext<Ctx | null>(null);

/**
 * Ein Context mit Reducer plus einer Tick-Schleife für die Rivalen. Die
 * abgeleiteten Werte (Liter, AGI-Fortschritt, Brunnenfüllstand, Drift)
 * werden hier einmal zentral berechnet, damit kein Screen sie doppelt
 * herleitet und dabei auseinanderläuft.
 */
export function SlopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const lastTick = useRef(Date.now());
  const seenDry = useRef<Set<string>>(new Set());
  const seenOvertake = useRef<LabId | null>(null);

  useEffect(() => {
    leaderboardSource.init(20260911);
  }, []);

  useEffect(() => {
    if (!state.lab) return;
    const interval = state.presentation ? 700 : 800;
    const id = setInterval(() => {
      const now = Date.now();
      const dtMs = now - lastTick.current;
      lastTick.current = now;

      let tokens = state.tokens;
      if (state.presentation) {
        tokens = state.tokens + 900;
      }

      const rivals = leaderboardSource.tick(dtMs, state.lab as LabId, tokens);
      dispatch({ type: "tick", rivals });
    }, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lab, state.presentation, state.tokens]);

  // Presentation-Modus: Tokens automatisch hochticken
  useEffect(() => {
    if (!state.presentation || !state.lab) return;
    const id = setInterval(() => dispatch({ type: "tap" }), 700);
    return () => clearInterval(id);
  }, [state.presentation, state.lab]);

  const liters = litersFromTokens(state.tokens);
  const fountains = useMemo(() => drainFountains(liters), [liters]);
  const agi = agiProgress(state.tokens);
  const lab = state.lab ? labById(state.lab) : null;
  const quality = qualityAfterDrops(state.totalQualityDrop, lab?.decayRate ?? 1);
  const drift = driftLevel(quality);
  const trees = treesFromLiters(liters);
  const standings = useMemo(() => ranked(state.rivals), [state.rivals]);
  const currentQuest = questAt(state.questIndex);

  // Ereignis-Erkennung: Brunnen trocken, Rivale überholt
  useEffect(() => {
    for (const f of fountains) {
      if (f.dry && !seenDry.current.has(f.id)) {
        seenDry.current.add(f.id);
        notify("warning");
        dispatch({
          type: "log",
          event: {
            id: `dry-${f.id}`,
            at: Date.now(),
            kind: "fountain-dry",
            text: `${f.name} ist trockengelegt.`,
          },
        });
      }
    }
  }, [fountains]);

  useEffect(() => {
    if (!state.lab || standings.length === 0) return;
    const leaderId = standings[0].id;
    if (leaderId !== state.lab && seenOvertake.current !== leaderId) {
      seenOvertake.current = leaderId;
      dispatch({
        type: "log",
        event: {
          id: `ot-${leaderId}-${Date.now()}`,
          at: Date.now(),
          kind: "overtaken",
          text: `${labById(leaderId).name} übernimmt die Führung.`,
        },
      });
    }
  }, [standings, state.lab]);

  const value: Ctx = {
    state,
    fountains,
    liters,
    agi,
    quality,
    drift,
    trees,
    standings,
    currentQuest,
    join: useCallback((l: LabId) => dispatch({ type: "join", lab: l }), []),
    tap: useCallback(() => dispatch({ type: "tap" }), []),
    dismissPaywall: useCallback(() => dispatch({ type: "dismissPaywall" }), []),
    resume: useCallback(() => dispatch({ type: "resume" }), []),
    setPresentation: useCallback((v: boolean) => dispatch({ type: "setPresentation", value: v }), []),
    triggerCollapse: useCallback(() => dispatch({ type: "collapse" }), []),
    reset: useCallback(() => dispatch({ type: "reset" }), []),
  };

  return <SlopContext.Provider value={value}>{children}</SlopContext.Provider>;
}

export function useSlop() {
  const ctx = useContext(SlopContext);
  if (!ctx) throw new Error("useSlop muss innerhalb von SlopProvider verwendet werden");
  return ctx;
}

export { questPool };
