import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FactOrSlopCard } from '@/components/FactOrSlopCard';
import { HapticButton } from '@/components/HapticButton';
import { PhotoQuestCard } from '@/components/PhotoQuestCard';
import {
  PHOTO_QUESTS,
  TRIVIA_QUESTS,
  useGameStore,
} from '@/state/useGameStore';
import type { Segment } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

const SEGMENT_CONTAINER_PADDING = 4;

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'photo', label: '📸 Foto-Missionen' },
  { id: 'trivia', label: '❓ Fakt oder Slop' },
];

const SLIDE_OUT_DURATION = 160;
const SLIDE_IN_DURATION = 220;

export default function QuestsScreen() {
  const {
    completedQuestIds,
    completePhotoQuest,
    answerTrivia,
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

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.subtitle}>Sammle Linzer Realdaten für das Modell.</Text>
      </View>

      <View style={styles.segmentContainer} onLayout={handleContainerLayout}>
        {innerWidth > 0 ? (
          <Animated.View
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
                { color: segment === entry.id ? THEME.colors.primary : THEME.colors.textMuted },
              ]}
            >
              {entry.label}
            </Text>
          </HapticButton>
        ))}
      </View>

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
            <View style={styles.doneCard}>
              <Text style={styles.doneTitle}>🎉 Alle Statements gefüttert.</Text>
              <HapticButton
                haptic="medium"
                style={styles.doneButton}
                onPress={handleTriviaRestart}
                accessibilityLabel="Nochmal"
              >
                <Text style={styles.doneButtonText}>Nochmal</Text>
              </HapticButton>
            </View>
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
    paddingHorizontal: 24,
  },
  header: {
    marginTop: THEME.spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: THEME.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.track,
    padding: SEGMENT_CONTAINER_PADDING,
    marginTop: THEME.spacing.lg,
    position: 'relative',
  },
  segmentThumb: {
    position: 'absolute',
    top: SEGMENT_CONTAINER_PADDING,
    left: SEGMENT_CONTAINER_PADDING,
    height: 40,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    marginTop: THEME.spacing.lg,
  },
  photoContent: {
    paddingBottom: THEME.tabBarClearance,
  },
  triviaBody: {
    flex: 1,
    marginTop: THEME.spacing.lg,
  },
  triviaContent: {
    flexGrow: 1,
    paddingBottom: THEME.tabBarClearance,
  },
  doneCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: THEME.spacing.md,
    height: 50,
    minWidth: 160,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.onAccent,
  },
});
