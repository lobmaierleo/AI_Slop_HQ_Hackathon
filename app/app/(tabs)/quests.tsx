import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutSurface } from '@/components/BrutSurface';
import { FactOrSlopCard } from '@/components/FactOrSlopCard';
import { HapticButton } from '@/components/HapticButton';
import { PhotoQuestCard } from '@/components/PhotoQuestCard';
import { Symbol } from '@/components/Symbol';
import {
  PHOTO_QUESTS,
  TRIVIA_QUESTS,
  useGameStore,
} from '@/state/useGameStore';
import type { Segment } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

const SEGMENT_CONTAINER_PADDING = 4;

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'photo', label: 'Vor Ort' },
  { id: 'trivia', label: 'Fakt oder Slop' },
];

const SLIDE_OUT_DURATION = 160;
const SLIDE_IN_DURATION = 220;

export default function QuestsScreen() {
  const {
    completedQuestIds,
    completePhotoQuest,
    answerTrivia,
    answeredTriviaIds,
    correctTriviaIds,
    pendingSegment,
    consumeSegment,
  } = useGameStore();

  const [segment, setSegment] = useState<Segment>('photo');
  const [innerWidth, setInnerWidth] = useState(0);
  const thumbX = useRef(new Animated.Value(0)).current;
  const thumbAnim = useRef<Animated.CompositeAnimation | null>(null);

  const [triviaIndex, setTriviaIndex] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (pendingSegment) {
      setSegment(pendingSegment);
      consumeSegment();
    }
  }, [pendingSegment, consumeSegment]);

  useEffect(() => {
    const thumbWidth = innerWidth / 2;
    const toValue = segment === 'photo' ? 0 : thumbWidth;
    thumbAnim.current?.stop();
    thumbAnim.current = Animated.spring(thumbX, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    });
    thumbAnim.current.start();
  }, [segment, innerWidth, thumbX]);

  useEffect(() => {
    return () => {
      thumbAnim.current?.stop();
      slideAnim.current?.stop();
    };
  }, []);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setInnerWidth(event.nativeEvent.layout.width - SEGMENT_CONTAINER_PADDING * 2);
  };

  const isTriviaDone = triviaIndex >= TRIVIA_QUESTS.length;

  const handleTriviaNext = () => {
    slideAnim.current?.stop();
    slideAnim.current = Animated.parallel([
      Animated.timing(slideX, {
        toValue: -40,
        duration: SLIDE_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: SLIDE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]);
    slideAnim.current.start(({ finished }) => {
      if (!finished) return;
      setTriviaIndex((value) => value + 1);
      slideX.setValue(40);
      slideOpacity.setValue(0);
      slideAnim.current = Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 16,
          bounciness: 4,
        }),
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: SLIDE_IN_DURATION,
          useNativeDriver: true,
        }),
      ]);
      slideAnim.current.start();
    });
  };

  const handleTriviaRestart = () => {
    slideAnim.current?.stop();
    slideX.setValue(0);
    slideOpacity.setValue(1);
    setTriviaIndex(0);
  };

  const thumbWidth = innerWidth / 2;

  const progressLabel =
    segment === 'photo'
      ? `${completedQuestIds.length} von ${PHOTO_QUESTS.length} Orten besucht`
      : `${answeredTriviaIds.length} von ${TRIVIA_QUESTS.length} Aussagen geprüft`;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.subtitle}>Finde es selbst heraus, statt die KI zu fragen.</Text>
      </View>

      <BrutSurface
        radius={THEME.radius.md}
        style={styles.segmentSurface}
        contentStyle={styles.segmentSurfaceContent}
      >
        <View style={styles.segmentRow} onLayout={handleContainerLayout}>
          {innerWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.segmentThumb,
                {
                  width: thumbWidth,
                  transform: [{ translateX: thumbX }],
                },
              ]}
            />
          ) : null}
          {SEGMENTS.map((entry) => (
            <HapticButton
              key={entry.id}
              haptic="selection"
              scaleTo={0.98}
              style={styles.segmentButton}
              onPress={() => setSegment(entry.id)}
              accessibilityLabel={entry.label}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: segment === entry.id ? THEME.colors.onSignal : THEME.colors.textMuted },
                ]}
              >
                {entry.label}
              </Text>
            </HapticButton>
          ))}
        </View>
      </BrutSurface>

      <Text style={styles.progressLabel}>{progressLabel}</Text>

      {segment === 'photo' ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.photoContent}
          showsVerticalScrollIndicator={false}
        >
          {PHOTO_QUESTS.map((quest) => (
            <PhotoQuestCard
              key={quest.id}
              quest={quest}
              done={completedQuestIds.includes(quest.id)}
              onComplete={completePhotoQuest}
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.triviaBody}
          contentContainerStyle={styles.triviaContent}
          showsVerticalScrollIndicator={false}
        >
          {isTriviaDone ? (
            <BrutSurface
              radius={THEME.radius.md}
              style={styles.doneCard}
              contentStyle={styles.doneCardContent}
            >
              <View style={styles.doneIcon}>
                <Symbol name="checkmark.seal.fill" size={28} color={THEME.colors.ink} />
              </View>
              <Text style={styles.doneTitle}>Alle Aussagen geprüft.</Text>
              <Text style={styles.doneScore}>
                {correctTriviaIds.length} von {TRIVIA_QUESTS.length} richtig erkannt
              </Text>
              <HapticButton
                haptic="medium"
                pressStyle="push"
                style={styles.doneButton}
                onPress={handleTriviaRestart}
                accessibilityLabel="Nochmal"
              >
                {(pressed) => (
                  <BrutSurface
                    tone="primary"
                    pressed={pressed}
                    radius={THEME.radius.sm}
                    contentStyle={styles.doneButtonFace}
                  >
                    <Text style={styles.doneButtonText}>Nochmal</Text>
                  </BrutSurface>
                )}
              </HapticButton>
            </BrutSurface>
          ) : (
            <Animated.View
              style={{
                opacity: slideOpacity,
                transform: [{ translateX: slideX }],
              }}
            >
              <FactOrSlopCard
                quest={TRIVIA_QUESTS[triviaIndex]}
                onAnswer={answerTrivia}
                onNext={handleTriviaNext}
                index={triviaIndex}
                total={TRIVIA_QUESTS.length}
              />
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    marginTop: THEME.spacing.md,
  },
  title: {
    ...THEME.type.title,
    color: THEME.colors.text,
  },
  subtitle: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  segmentSurface: {
    marginTop: THEME.spacing.lg,
  },
  segmentSurfaceContent: {
    padding: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    height: 48,
    padding: SEGMENT_CONTAINER_PADDING,
    position: 'relative',
  },
  segmentThumb: {
    position: 'absolute',
    top: SEGMENT_CONTAINER_PADDING,
    left: SEGMENT_CONTAINER_PADDING,
    height: 40,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    ...THEME.type.captionStrong,
  },
  progressLabel: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  body: {
    flex: 1,
    marginTop: THEME.spacing.md,
  },
  photoContent: {
    paddingBottom: THEME.tabBarClearance,
  },
  triviaBody: {
    flex: 1,
    marginTop: THEME.spacing.md,
  },
  triviaContent: {
    flexGrow: 1,
    paddingBottom: THEME.tabBarClearance,
  },
  doneCard: {
    marginTop: THEME.spacing.md,
  },
  doneCardContent: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  doneIcon: {
    width: 52,
    height: 52,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.width,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    ...THEME.type.heading,
    color: THEME.colors.text,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
  },
  doneScore: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  doneButton: {
    marginTop: THEME.spacing.lg,
  },
  doneButtonFace: {
    height: 50,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  doneButtonText: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.onSignal,
  },
});
