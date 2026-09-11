import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { HapticButton } from '@/components/HapticButton';
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
    <Animated.View style={[styles.card, { transform: [{ translateX: shakeX }] }]}>
      <View style={styles.counterRow}>
        <Text style={styles.counter}>
          {index + 1} / {total}
        </Text>
      </View>

      <Text style={styles.statement}>{quest.statement}</Text>

      {!answered ? (
        <View style={styles.actions}>
          <HapticButton
            haptic="medium"
            style={[styles.actionButton, { backgroundColor: THEME.colors.success }]}
            onPress={() => handle(true)}
            accessibilityLabel="Echter Fakt"
          >
            <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit>
              ✅ ECHTER FAKT
            </Text>
          </HapticButton>
          <HapticButton
            haptic="medium"
            style={[styles.actionButton, { backgroundColor: THEME.colors.error }]}
            onPress={() => handle(false)}
            accessibilityLabel="AI Slop"
          >
            <Text style={styles.actionText} numberOfLines={1} adjustsFontSizeToFit>
              🛑 AI SLOP
            </Text>
          </HapticButton>
        </View>
      ) : (
        <View>
          <View
            style={[
              styles.banner,
              { backgroundColor: wasCorrect ? THEME.colors.successLight : THEME.colors.errorLight },
            ]}
          >
            <Text
              style={[
                styles.bannerTitle,
                { color: wasCorrect ? THEME.colors.success : THEME.colors.error },
              ]}
            >
              {wasCorrect ? 'Richtig! Modell gefüttert.' : 'Falsch! Halluzination um 5 % gestiegen.'}
            </Text>
            <Text style={styles.bannerExplanation}>{quest.explanation}</Text>
          </View>

          <HapticButton haptic="light" style={styles.nextButton} onPress={onNext} accessibilityLabel="Weiter">
            <Text style={styles.nextButtonText}>Weiter →</Text>
          </HapticButton>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
  },
  counterRow: {
    alignItems: 'flex-end',
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  statement: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
    lineHeight: 27,
    letterSpacing: -0.3,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.onAccent,
  },
  banner: {
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerExplanation: {
    fontSize: 13,
    color: THEME.colors.text,
    lineHeight: 18,
    marginTop: 6,
  },
  nextButton: {
    height: 50,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.spacing.md,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.onAccent,
  },
});

export default FactOrSlopCard;
