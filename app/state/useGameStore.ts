import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import quests from '@/data/quests.json';

export type TeamId = 'closedai' | 'antithropic' | 'grek' | 'shallowseek';

export type Team = {
  id: TeamId;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  tint: string;
  rank: number;
};

export const TEAMS: Team[] = [
  {
    id: 'closedai',
    name: 'ClosedAI',
    tagline: 'Openness ist überbewertet. Alles bleibt in unserer Blackbox.',
    emoji: '🟧',
    color: '#FF5C00',
    tint: '#FFF0E6',
    rank: 2,
  },
  {
    id: 'antithropic',
    name: 'Antithropic',
    tagline: '100 % harmlos. Beantwortet nichts, verbraucht trotzdem Kühlwasser.',
    emoji: '🟪',
    color: '#7C4DFF',
    tint: '#F0EBFF',
    rank: 1,
  },
  {
    id: 'grek',
    name: 'Grek',
    tagline: 'Volles Chaos, null Zensur, maximale Halluzination.',
    emoji: '⚡',
    color: '#00B0FF',
    tint: '#E4F5FF',
    rank: 4,
  },
  {
    id: 'shallowseek',
    name: 'ShallowSeek',
    tagline: 'Gleiche Power, 90 % billiger, weil wir von den anderen kopieren.',
    emoji: '🌀',
    color: '#00C853',
    tint: '#E3F9EB',
    rank: 3,
  },
];

export type Segment = 'photo' | 'trivia';

export type PhotoQuest = (typeof quests.photoQuests)[number];
export type TriviaQuest = (typeof quests.triviaQuests)[number];

export type GameState = {
  team: Team | null;
  waterLiters: number;
  slopTokens: number;
  agiProgress: number;
  hallucination: number;
  completedQuestIds: string[];
  answeredTriviaIds: string[];
  pendingSegment: Segment | null;
  selectTeam: (id: TeamId) => void;
  completePhotoQuest: (questId: string) => void;
  answerTrivia: (questId: string, wasCorrect: boolean) => void;
  requestSegment: (segment: Segment) => void;
  consumeSegment: () => void;
  resetGame: () => void;
};

const START = {
  waterLiters: 24.5,
  slopTokens: 8200,
  agiProgress: 68,
  hallucination: 0,
};

const AGI_CEILING = 99.4;

/** Nähert sich asymptotisch der Decke — AGI ist immer knapp außer Reichweite. */
function advanceAgi(current: number, step: number) {
  return Math.min(AGI_CEILING, current + (AGI_CEILING - current) * step);
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [waterLiters, setWaterLiters] = useState(START.waterLiters);
  const [slopTokens, setSlopTokens] = useState(START.slopTokens);
  const [agiProgress, setAgiProgress] = useState(START.agiProgress);
  const [hallucination, setHallucination] = useState(START.hallucination);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [answeredTriviaIds, setAnsweredTriviaIds] = useState<string[]>([]);
  const [pendingSegment, setPendingSegment] = useState<Segment | null>(null);

  const selectTeam = useCallback((id: TeamId) => {
    setTeam(TEAMS.find((entry) => entry.id === id) ?? null);
  }, []);

  const completePhotoQuest = useCallback((questId: string) => {
    const quest = quests.photoQuests.find((entry) => entry.id === questId);
    if (!quest) return;
    setCompletedQuestIds((ids) => (ids.includes(questId) ? ids : [...ids, questId]));
    setWaterLiters((value) => value + quest.waterLiters);
    setSlopTokens((value) => value + quest.tokens);
    setAgiProgress((value) => advanceAgi(value, 0.06));
  }, []);

  const answerTrivia = useCallback((questId: string, wasCorrect: boolean) => {
    setAnsweredTriviaIds((ids) => (ids.includes(questId) ? ids : [...ids, questId]));
    if (wasCorrect) {
      setSlopTokens((value) => value + 400);
      setWaterLiters((value) => value + 1.2);
      setAgiProgress((value) => advanceAgi(value, 0.03));
    } else {
      setHallucination((value) => value + 5);
      setWaterLiters((value) => value + 2.4);
    }
  }, []);

  const requestSegment = useCallback((segment: Segment) => setPendingSegment(segment), []);
  const consumeSegment = useCallback(() => setPendingSegment(null), []);

  const resetGame = useCallback(() => {
    setTeam(null);
    setWaterLiters(START.waterLiters);
    setSlopTokens(START.slopTokens);
    setAgiProgress(START.agiProgress);
    setHallucination(START.hallucination);
    setCompletedQuestIds([]);
    setAnsweredTriviaIds([]);
    setPendingSegment(null);
  }, []);

  const value = useMemo<GameState>(
    () => ({
      team,
      waterLiters,
      slopTokens,
      agiProgress,
      hallucination,
      completedQuestIds,
      answeredTriviaIds,
      pendingSegment,
      selectTeam,
      completePhotoQuest,
      answerTrivia,
      requestSegment,
      consumeSegment,
      resetGame,
    }),
    [
      team,
      waterLiters,
      slopTokens,
      agiProgress,
      hallucination,
      completedQuestIds,
      answeredTriviaIds,
      pendingSegment,
      selectTeam,
      completePhotoQuest,
      answerTrivia,
      requestSegment,
      consumeSegment,
      resetGame,
    ],
  );

  return createElement(GameContext.Provider, { value }, children);
}

export function useGameStore(): GameState {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGameStore muss innerhalb von <GameProvider> verwendet werden.');
  return value;
}

export const PHOTO_QUESTS = quests.photoQuests;
export const TRIVIA_QUESTS = quests.triviaQuests;
