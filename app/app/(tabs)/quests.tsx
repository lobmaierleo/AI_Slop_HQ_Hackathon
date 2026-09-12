import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoQuestCard } from '@/components/PhotoQuestCard';
import { QuestDetailSheet } from '@/components/QuestDetailSheet';
import { meters } from '@/lib/net';
import { useUserLocation } from '@/lib/useUserLocation';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import type { PhotoQuest } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

export default function QuestsScreen() {
  const { completedQuestIds, pendingQuestId, consumeQuest } = useGameStore();
  const [openQuest, setOpenQuest] = useState<PhotoQuest | null>(null);
  const position = useUserLocation();

  useEffect(() => {
    if (!pendingQuestId) return;
    const q = PHOTO_QUESTS.find((x) => x.id === pendingQuestId);
    if (q) setOpenQuest(q);
    consumeQuest();
  }, [pendingQuestId, consumeQuest]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.subtitle}>Finde es selbst heraus, statt die KI zu fragen.</Text>
      </View>

      <Text style={styles.progressLabel}>
        {completedQuestIds.length} von {PHOTO_QUESTS.length} Orten besucht
      </Text>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {PHOTO_QUESTS.map((quest) => (
          <PhotoQuestCard
            key={quest.id}
            quest={quest}
            done={completedQuestIds.includes(quest.id)}
            onPress={() => setOpenQuest(quest)}
            distanceM={position ? meters(position.lat, position.lon, quest.lat, quest.lon) : undefined}
          />
        ))}
      </ScrollView>

      {openQuest ? (
        <QuestDetailSheet quest={openQuest} onClose={() => setOpenQuest(null)} />
      ) : null}
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
  progressLabel: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  body: {
    flex: 1,
    marginTop: THEME.spacing.md,
  },
  content: {
    paddingBottom: THEME.tabBarClearance,
  },
});
