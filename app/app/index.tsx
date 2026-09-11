import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HapticButton } from '@/components/HapticButton';
import { TEAMS, useGameStore } from '@/state/useGameStore';
import type { Team } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

export default function Index() {
  const router = useRouter();
  const { team, selectTeam } = useGameStore();

  if (team) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSelect = (id: Team['id']) => {
    selectTeam(id);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>AI SLOPPY · ARS ELECTRONICA 2026</Text>
        <Text style={styles.title}>Wähle dein KI-Lab.</Text>
        <Text style={styles.intro}>
          Trainiere die AGI mit echten Daten aus Linz — koste es das gesamte Linzer Trinkwasser.
        </Text>

        <View style={styles.teamList}>
          {TEAMS.map((entry) => (
            <HapticButton
              key={entry.id}
              haptic="medium"
              onPress={() => handleSelect(entry.id)}
              style={[
                styles.teamCard,
                { backgroundColor: entry.tint, borderColor: `${entry.color}33` },
              ]}
              accessibilityLabel={entry.name}
            >
              <View style={styles.teamEmojiCircle}>
                <Text style={styles.teamEmoji}>{entry.emoji}</Text>
              </View>
              <View style={styles.teamTextBlock}>
                <Text style={[styles.teamName, { color: entry.color }]}>{entry.name}</Text>
                <Text style={styles.teamTagline} numberOfLines={2}>
                  {entry.tagline}
                </Text>
              </View>
            </HapticButton>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.colors.text,
    letterSpacing: -0.8,
    marginBottom: THEME.spacing.sm,
  },
  intro: {
    fontSize: 17,
    color: THEME.colors.textMuted,
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
  },
  teamList: {
    marginTop: THEME.spacing.sm,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.radius.lg,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 14,
    minHeight: 104,
  },
  teamEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  teamEmoji: {
    fontSize: 34,
  },
  teamTextBlock: {
    flex: 1,
  },
  teamName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamTagline: {
    fontSize: 14,
    color: THEME.colors.text,
    opacity: 0.7,
    lineHeight: 19,
  },
});
