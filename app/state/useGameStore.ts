import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import quests from '@/data/quests.json';
import { LITERS_PER_QUERY, queriesAvoided } from '@/lib/net';
import type { SymbolName } from '@/components/Symbol';

/** Eine Zeile der Kennzahlentabelle. Beim Build aus der Quellzeile gelesen. */
export type QuestStat = { label: string; value: string };

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
  /** Der Wissenstext der Detailansicht: warum Ort und Datensatz zusammengehören. */
  info: string;
  /** Zwei bis fünf Kennzahlen aus dem Datensatz, Label und Wert getrennt. */
  stats: QuestStat[];
  /** Nur an manchen Orten hängt eine Runde Fakt oder Slop. Meist leer. */
  triviaIds: string[];
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

const TRIVIA_BY_ID = new Map(TRIVIA_QUESTS.map((t) => [t.id, t]));

/**
 * Die Aussagen, die an einem Ort hängen. Fakt oder Slop ist kein eigener
 * Bereich mehr, sondern die Zugabe in der Detailansicht mancher Orte --
 * deshalb wird hier aufgelöst und nicht mehr über einen globalen Index.
 */
export function triviaFor(quest: PhotoQuest): TriviaQuest[] {
  return quest.triviaIds
    .map((id) => TRIVIA_BY_ID.get(id))
    .filter((t): t is TriviaQuest => t !== undefined);
}

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
  /**
   * Der Ort, dessen Detailansicht sich beim nächsten Betreten des Quests-Tabs
   * öffnen soll. Ersetzt die frühere Bereichsumschaltung: es gibt keine zwei
   * Bereiche mehr, sondern nur noch Orte und ihre Subfenster.
   */
  pendingQuestId: string | null;
  start: () => void;
  completePhotoQuest: (questId: string, photoUri?: string) => void;
  answerTrivia: (questId: string, wasCorrect: boolean) => void;
  requestQuest: (questId: string) => void;
  consumeQuest: () => void;
  resetProgress: () => void;
};

const STORAGE_KEY = 'selberdenken.v1';

/** Ein richtig erkanntes Statement spart eine Abfrage, ein falsches nichts. */
const TRIVIA_REWARD_LITERS = LITERS_PER_QUERY;

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);

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
    setPendingQuestId(null);
  }, []);

  const requestQuest = useCallback((questId: string) => setPendingQuestId(questId), []);
  const consumeQuest = useCallback(() => setPendingQuestId(null), []);

  const value = useMemo<GameState>(
    () => ({
      ...saved,
      hydrated,
      aiQueriesAvoided: queriesAvoided(saved.savedWaterLiters),
      pendingQuestId,
      start,
      completePhotoQuest,
      answerTrivia,
      requestQuest,
      consumeQuest,
      resetProgress,
    }),
    [saved, hydrated, pendingQuestId, start, completePhotoQuest, answerTrivia,
      requestQuest, consumeQuest, resetProgress],
  );

  return createElement(GameContext.Provider, { value }, children);
}

export function useGameStore(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameStore muss innerhalb von GameProvider stehen');
  return ctx;
}
