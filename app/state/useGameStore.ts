import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import quests from '@/data/quests.json';
import { LITERS_PER_QUERY, queriesAvoided } from '@/lib/net';
import type { SymbolName } from '@/components/Symbol';

export type PhotoQuest = {
  id: string;
  type: string;
  symbol: SymbolName;
  badge: string;
  title: string;
  location: string;
  desc: string;
  teaser: string;
  /** Der Satz, der erst nach dem Besuch sichtbar wird. Kommt aus dem Datensatz. */
  fact: string;
  waterLiters: number;
  lat: number;
  lon: number;
  source: string;
};

export type TriviaQuest = {
  id: string;
  statement: string;
  isFact: boolean;
  explanation: string;
};

export const PHOTO_QUESTS = quests.photoQuests as PhotoQuest[];
export const TRIVIA_QUESTS = quests.triviaQuests as TriviaQuest[];

/** Die beiden Bereiche des Quests-Tabs. */
export type Segment = 'photo' | 'trivia';

/** Nur diese Felder ueberleben einen App-Neustart. */
type Persisted = {
  hasStarted: boolean;
  savedWaterLiters: number;
  completedQuestIds: string[];
  completedPhotos: Record<string, string>;
  answeredTriviaIds: string[];
  correctTriviaIds: string[];
};

const EMPTY: Persisted = {
  hasStarted: false,
  savedWaterLiters: 0,
  completedQuestIds: [],
  completedPhotos: {},
  answeredTriviaIds: [],
  correctTriviaIds: [],
};

export type GameState = Persisted & {
  /** Erst true, wenn AsyncStorage gelesen wurde. Vorher nichts rendern. */
  hydrated: boolean;
  /** Abgeleitet aus savedWaterLiters, damit die Zahl im Pitch nachrechenbar bleibt. */
  aiQueriesAvoided: number;
  pendingSegment: Segment | null;
  start: () => void;
  completePhotoQuest: (questId: string, photoUri?: string) => void;
  answerTrivia: (questId: string, wasCorrect: boolean) => void;
  requestSegment: (segment: Segment) => void;
  consumeSegment: () => void;
  resetProgress: () => void;
};

const STORAGE_KEY = 'selberdenken.v1';

/** Ein richtig erkanntes Statement spart eine Abfrage, ein falsches nichts. */
const TRIVIA_REWARD_LITERS = LITERS_PER_QUERY;

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [pendingSegment, setPendingSegment] = useState<Segment | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (alive && raw) setSaved({ ...EMPTY, ...(JSON.parse(raw) as Persisted) });
      })
      // Ein kaputter Eintrag darf den Start nicht blockieren -- dann eben frisch.
      .catch(() => undefined)
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved, hydrated]);

  const start = useCallback(() => {
    setSaved((s) => ({ ...s, hasStarted: true }));
  }, []);

  const completePhotoQuest = useCallback((questId: string, photoUri?: string) => {
    setSaved((s) => {
      if (s.completedQuestIds.includes(questId)) return s;
      const quest = PHOTO_QUESTS.find((q) => q.id === questId);
      if (!quest) return s;
      return {
        ...s,
        completedQuestIds: [...s.completedQuestIds, questId],
        savedWaterLiters: s.savedWaterLiters + quest.waterLiters,
        completedPhotos: photoUri
          ? { ...s.completedPhotos, [questId]: photoUri }
          : s.completedPhotos,
      };
    });
  }, []);

  const answerTrivia = useCallback((questId: string, wasCorrect: boolean) => {
    setSaved((s) => {
      if (s.answeredTriviaIds.includes(questId)) return s;
      return {
        ...s,
        answeredTriviaIds: [...s.answeredTriviaIds, questId],
        correctTriviaIds: wasCorrect ? [...s.correctTriviaIds, questId] : s.correctTriviaIds,
        savedWaterLiters: wasCorrect
          ? s.savedWaterLiters + TRIVIA_REWARD_LITERS
          : s.savedWaterLiters,
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setSaved(EMPTY);
    setPendingSegment(null);
  }, []);

  const requestSegment = useCallback((segment: Segment) => setPendingSegment(segment), []);
  const consumeSegment = useCallback(() => setPendingSegment(null), []);

  const value = useMemo<GameState>(
    () => ({
      ...saved,
      hydrated,
      aiQueriesAvoided: queriesAvoided(saved.savedWaterLiters),
      pendingSegment,
      start,
      completePhotoQuest,
      answerTrivia,
      requestSegment,
      consumeSegment,
      resetProgress,
    }),
    [saved, hydrated, pendingSegment, start, completePhotoQuest, answerTrivia,
      requestSegment, consumeSegment, resetProgress],
  );

  return createElement(GameContext.Provider, { value }, children);
}

export function useGameStore(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameStore muss innerhalb von GameProvider stehen');
  return ctx;
}
