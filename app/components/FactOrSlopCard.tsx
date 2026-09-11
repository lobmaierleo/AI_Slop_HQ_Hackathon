import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { GlassSurface } from '@/components/GlassSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol } from '@/components/Symbol';
import { THEME } from '@/theme/colors';
import type { TriviaQuest } from '@/state/useGameStore';

type Props = {
  quest: TriviaQuest;
  onAnswer: (questId: string, wasCorrect: boolean) => void;
  onNext: () => void;
  index: number;
  total: number;
};

const SHAKE_STEPS = [0, -10, 9, -7, 5, 0];
const SHAKE_STEP_DURATION = 45;

/**
 * Deckelt die Statement-Höhe unabhängig von der Textlänge: lange Statements
 * (z.B. lange Projekttitel) schrumpfen bis zu diesem Skalierungsfaktor statt
 * beliebig viele Zeilen zu belegen und die Buttons aus dem ersten Viewport
 * zu drängen.
 */
const STATEMENT_MAX_LINES = 5;
const STATEMENT_MIN_FONT_SCALE = 0.75;

/** Schützt die Beschriftung der Antwort-Pillen vor Überlauf bei schmalen Geräten. */
const ACTION_MIN_FONT_SCALE = 0.85;

/** Eine korrekt erkannte Aussage spart eine LLM-Abfrage -- die Hälfte des Wertes einer Vor-Ort-Quest. */
const TRIVIA_SAVED_LITERS_LABEL = '0,5 L';

export function FactOrSlopCard({ quest, onAnswer, onNext, index, total }: Props) {
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const shakeX = useRef(new Animated.Value(0)).current;
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAnswered(false);
    setWasCorrect(false);
    shakeX.setValue(0);
  }, [quest.id, shakeX]);

  useEffect(() => {
    return () => {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
    };
  }, []);

  const handle = (answeredFact: boolean) => {
    const correct = answeredFact === quest.isFact;
    setAnswered(true);
    setWasCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      doubleTapTimer.current = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }, 120);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Animated.sequence(
        SHAKE_STEPS.map((value) =>
          Animated.timing(shakeX, {
            toValue: value,
            duration: SHAKE_STEP_DURATION,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }

    onAnswer(quest.id, correct);
  };

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
      <GlassSurface radius={THEME.radius.lg} style={styles.card}>
        <View style={styles.counterRow}>
          <Text style={styles.counter}>
            {index + 1} / {total}
          </Text>
        </View>

        <Text
          style={styles.statement}
          numberOfLines={STATEMENT_MAX_LINES}
          adjustsFontSizeToFit
          minimumFontScale={STATEMENT_MIN_FONT_SCALE}
        >
          {quest.statement}
        </Text>

        {!answered ? (
          // Beide Optionen bleiben bewusst gleich neutral -- ein Akzent
          // gehört dem System, nicht der Verführung zur richtigen Antwort.
          <View style={styles.actions}>
            <HapticButton
              haptic="medium"
              style={styles.actionSlot}
              onPress={() => handle(true)}
              accessibilityLabel="Echter Fakt"
            >
              <GlassSurface radius={THEME.radius.pill} contentStyle={styles.actionContent}>
                <Symbol name="checkmark.seal.fill" size={18} color={THEME.colors.text} />
                <Text
                  style={styles.actionText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={ACTION_MIN_FONT_SCALE}
                >
                  Echter Fakt
                </Text>
              </GlassSurface>
            </HapticButton>
            <HapticButton
              haptic="medium"
              style={styles.actionSlot}
              onPress={() => handle(false)}
              accessibilityLabel="AI Slop"
            >
              <GlassSurface radius={THEME.radius.pill} contentStyle={styles.actionContent}>
                <Symbol name="exclamationmark.triangle.fill" size={18} color={THEME.colors.text} />
                <Text
                  style={styles.actionText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={ACTION_MIN_FONT_SCALE}
                >
                  AI Slop
                </Text>
              </GlassSurface>
            </HapticButton>
          </View>
        ) : (
          <View>
            <GlassSurface radius={THEME.radius.md} flat style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Symbol
                  name={wasCorrect ? 'checkmark.seal.fill' : 'xmark.seal.fill'}
                  size={18}
                  color={wasCorrect ? THEME.colors.success : THEME.colors.error}
                />
                <Text
                  style={[
                    styles.resultTitle,
                    { color: wasCorrect ? THEME.colors.success : THEME.colors.error },
                  ]}
                >
                  {wasCorrect ? 'Richtig erkannt.' : 'Falsch erkannt.'}
                </Text>
              </View>
              <Text style={styles.explanation}>{quest.explanation}</Text>
              {wasCorrect ? (
                <Text style={styles.savedNote}>{TRIVIA_SAVED_LITERS_LABEL} Kühlwasser gespart.</Text>
              ) : null}
            </GlassSurface>

            <HapticButton haptic="light" style={styles.nextButton} onPress={onNext} accessibilityLabel="Weiter">
              <Text style={styles.nextButtonText}>Weiter</Text>
            </HapticButton>
          </View>
        )}
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: THEME.spacing.md,
  },
  counterRow: {
    alignItems: 'flex-end',
  },
  counter: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
  },
  statement: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  actionSlot: {
    flex: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    height: 56,
  },
  actionText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
  resultCard: {
    marginTop: THEME.spacing.xs,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  resultTitle: {
    ...THEME.type.bodyStrong,
  },
  explanation: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  savedNote: {
    ...THEME.type.caption,
    color: THEME.colors.textFaint,
    marginTop: THEME.spacing.sm,
  },
  nextButton: {
    height: 50,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
  },
  nextButtonText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onAccent,
  },
});

export default FactOrSlopCard;
