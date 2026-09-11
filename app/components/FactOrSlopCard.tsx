import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BrutSurface } from '@/components/BrutSurface';
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

/** Schützt die Beschriftung der Antwortblöcke vor Überlauf bei schmalen Geräten. */
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
      <BrutSurface radius={THEME.radius.md} style={styles.card}>
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
          // Cyan und Pink sind gleich laut und beide nicht die Aktionsfarbe --
          // keiner der zwei Wege wirkt dadurch wie der vorgesehene.
          <View style={styles.actions}>
            <HapticButton
              haptic="medium"
              pressStyle="push"
              style={styles.actionSlot}
              onPress={() => handle(true)}
              accessibilityLabel="Echter Fakt"
            >
              {(pressed) => (
                <BrutSurface
                  tone="tertiary"
                  pressed={pressed}
                  radius={THEME.radius.sm}
                  contentStyle={styles.actionContent}
                >
                  <Symbol name="checkmark.seal.fill" size={18} color={THEME.colors.ink} />
                  <Text
                    style={styles.actionText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={ACTION_MIN_FONT_SCALE}
                  >
                    Echter Fakt
                  </Text>
                </BrutSurface>
              )}
            </HapticButton>
            <HapticButton
              haptic="medium"
              pressStyle="push"
              style={styles.actionSlot}
              onPress={() => handle(false)}
              accessibilityLabel="AI Slop"
            >
              {(pressed) => (
                <BrutSurface
                  tone="secondary"
                  pressed={pressed}
                  radius={THEME.radius.sm}
                  contentStyle={styles.actionContent}
                >
                  <Symbol name="exclamationmark.triangle.fill" size={18} color={THEME.colors.ink} />
                  <Text
                    style={styles.actionText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={ACTION_MIN_FONT_SCALE}
                  >
                    AI Slop
                  </Text>
                </BrutSurface>
              )}
            </HapticButton>
          </View>
        ) : (
          <View>
            <View
              style={[
                styles.resultCard,
                { backgroundColor: wasCorrect ? THEME.colors.success : THEME.colors.error },
              ]}
            >
              <View style={styles.resultHeader}>
                <Symbol
                  name={wasCorrect ? 'checkmark.seal.fill' : 'xmark.seal.fill'}
                  size={18}
                  color={THEME.colors.ink}
                />
                <Text style={styles.resultTitle}>
                  {wasCorrect ? 'Richtig erkannt.' : 'Falsch erkannt.'}
                </Text>
              </View>
              <Text style={styles.explanation}>{quest.explanation}</Text>
              {wasCorrect ? (
                <Text style={styles.savedNote}>{TRIVIA_SAVED_LITERS_LABEL} Kühlwasser gespart.</Text>
              ) : null}
            </View>

            <HapticButton
              haptic="light"
              pressStyle="push"
              style={styles.nextButton}
              onPress={onNext}
              accessibilityLabel="Weiter"
            >
              {(pressed) => (
                <BrutSurface
                  tone="primary"
                  pressed={pressed}
                  radius={THEME.radius.sm}
                  contentStyle={styles.nextButtonFace}
                >
                  <Text style={styles.nextButtonText}>Weiter</Text>
                </BrutSurface>
              )}
            </HapticButton>
          </View>
        )}
      </BrutSurface>
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
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
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
    paddingHorizontal: THEME.spacing.xs,
  },
  actionText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
    flexShrink: 1,
  },
  // Das Ergebnis ist die zweite und letzte Ebene: ein Farbblock mit Rahmen,
  // ohne eigenen Schatten -- der gehoert der Karte darum.
  resultCard: {
    marginTop: THEME.spacing.xs,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  resultTitle: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
  },
  explanation: {
    ...THEME.type.body,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
  },
  savedNote: {
    ...THEME.type.captionStrong,
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
  },
  nextButton: {
    marginTop: THEME.spacing.md,
  },
  nextButtonFace: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
  },
});

export default FactOrSlopCard;
