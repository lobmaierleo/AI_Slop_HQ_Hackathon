import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutButton } from '@/components/BrutButton';
import { BrutSurface, type Tone } from '@/components/BrutSurface';
import { QuestDetailSheet } from '@/components/QuestDetailSheet';
import { SynapseGraph } from '@/components/SynapseGraph';
import { EDGES, activeEdges } from '@/lib/net';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

/** Seitliche Luft des Graphen -- er darf breiter sein als der Fliesstext. */
const GRAPH_MARGIN = THEME.spacing.xs;

/**
 * Takt des Replays. Der Pop eines Knotens dauert 420 ms, das Zeichnen einer
 * Kante 650 ms -- ein Schritt alle 320 ms laesst beides ueberlappen, und das
 * ganze Netz steht bei 23 Orten nach gut sieben Sekunden wieder.
 */
const REPLAY_STEP_MS = 320;
/** Pause nach dem letzten Knoten, bevor der Knopf wieder frei ist. */
const REPLAY_SETTLE_MS = 700;

export default function NetworkScreen() {
  const { completedQuestIds, savedWaterLiters, answeredTriviaIds, correctTriviaIds } = useGameStore();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  /**
   * Das Replay: `null` heisst Ruhe, das ganze Netz steht. Eine Zahl heisst,
   * so viele der entdeckten Orte sind gerade sichtbar -- in der echten
   * Reihenfolge des Fundes, denn `completedQuestIds` wird beim Entdecken
   * hinten angehaengt und nie umsortiert. Der Graph bekommt nur die
   * Teilliste; Knoten und Kanten, die dazukommen, animieren sich von selbst,
   * weil sie neu gemountet werden. Es gibt also keine zweite Animationslogik,
   * nur den Fund noch einmal, Schritt fuer Schritt.
   */
  const [replayCount, setReplayCount] = useState<number | null>(null);
  const shownIds = useMemo(
    () => (replayCount === null ? completedQuestIds : completedQuestIds.slice(0, replayCount)),
    [completedQuestIds, replayCount],
  );

  useEffect(() => {
    if (replayCount === null) return;
    if (replayCount >= completedQuestIds.length) {
      const settle = setTimeout(() => setReplayCount(null), REPLAY_SETTLE_MS);
      return () => clearTimeout(settle);
    }
    const step = setTimeout(() => {
      const next = replayCount + 1;
      // Eine Datenbruecke, die sich gerade schliesst, schlaegt haerter an als
      // ein blosser Knoten -- man soll den Unterschied in der Hand spueren.
      const before = new Set(
        activeEdges(completedQuestIds.slice(0, replayCount)).map((e) => `${e.a}-${e.b}`),
      );
      const closesBridge = activeEdges(completedQuestIds.slice(0, next)).some(
        (e) => e.kind === 'space' && !before.has(`${e.a}-${e.b}`),
      );
      (closesBridge
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : Haptics.selectionAsync()
      ).catch(() => undefined);
      setReplayCount(next);
    }, REPLAY_STEP_MS);
    return () => clearTimeout(step);
  }, [replayCount, completedQuestIds]);

  const replaying = replayCount !== null;
  const startReplay = () => {
    if (replaying || completedQuestIds.length < 2) return;
    setSelectedId(null);
    // Mit dem ersten Ort beginnen, nicht mit null Orten: ein leeres Netz
    // zeigt die Leerkarte statt des Rahmens, und der Sprung dazwischen ruckelt.
    setReplayCount(1);
    Haptics.selectionAsync().catch(() => undefined);
  };

  const size = width - GRAPH_MARGIN * 2;
  // Waehrend des Replays zaehlt die Kachel mit hoch -- dieselbe Teilliste wie der Graph.
  const active = useMemo(() => activeEdges(shownIds).length, [shownIds]);

  // Ohne Antwort gibt es keine Quote. 100 % bei null Versuchen waere gelogen.
  const autonomy = answeredTriviaIds.length
    ? Math.round((correctTriviaIds.length / answeredTriviaIds.length) * 100)
    : null;

  // Ein Zustand, zwei Wirkungen: der Ring im Graphen und das offene Sheet
  // haengen an derselben ID und koennen nicht auseinanderlaufen. Ausgewaehlt
  // werden kann ohnehin nur, was der Graph rendert -- also nur Entdecktes.
  const openQuest = selectedId
    ? (PHOTO_QUESTS.find((q) => q.id === selectedId) ?? null)
    : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>DEIN NETZ</Text>
        <Text style={styles.title}>Jeder Ort ein Neuron</Text>
        <Text style={styles.lead}>
          Die Knoten stehen dort, wo die Orte in Linz wirklich liegen. Eine Synapse entsteht, sobald
          du beide Enden selbst gesehen hast.
        </Text>

        <View style={styles.metrics}>
          <Metric tone="secondary" label="Synapsen" value={`${active}`} caption={`von ${EDGES.length}`} />
          <Metric
            tone="tertiary"
            label="Wasser"
            value={savedWaterLiters.toFixed(1).replace('.', ',')}
            caption="Liter gespart"
          />
          <Metric
            tone="primary"
            label="Autonomie"
            value={autonomy === null ? '–' : `${autonomy} %`}
            caption={
              autonomy === null
                ? 'noch offen'
                : `${correctTriviaIds.length}/${answeredTriviaIds.length} bei Fakt oder Slop`
            }
          />
        </View>

        <View style={styles.graphWrap}>
          <SynapseGraph
            size={size}
            completedIds={shownIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scrollRef={scrollRef}
          />
        </View>

        {/* Der Spaziergang noch einmal, in Sekunden: das Netz waechst in der
            Reihenfolge nach, in der die Orte wirklich gefunden wurden. Erst ab
            zwei Orten -- vorher gibt es nichts, das wachsen koennte. */}
        {completedQuestIds.length >= 2 ? (
          <BrutButton
            label={replaying ? 'Wächst …' : 'Nochmal wachsen lassen'}
            icon="arrow.counterclockwise"
            disabled={replaying}
            onPress={startReplay}
            accessibilityLabel="Netz noch einmal wachsen lassen"
          />
        ) : null}

        {completedQuestIds.length > 0 ? (
          <Text style={styles.hint}>Tippe einen Knoten an, um zu sehen, was dort steht.</Text>
        ) : null}
      </ScrollView>

      {openQuest ? (
        <QuestDetailSheet quest={openQuest} onClose={() => setSelectedId(null)} />
      ) : null}
    </SafeAreaView>
  );
}

function Metric({
  tone,
  label,
  value,
  caption,
}: {
  tone: Tone;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <BrutSurface
      tone={tone}
      shadow="sm"
      radius={THEME.radius.sm}
      style={styles.metric}
      contentStyle={styles.metricBody}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={styles.metricCaption} numberOfLines={1}>
        {caption}
      </Text>
    </BrutSurface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.colors.background },
  content: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.tabBarClearance,
    gap: THEME.spacing.md,
  },
  eyebrow: { ...THEME.type.eyebrow, color: THEME.colors.text },
  title: { ...THEME.type.title, color: THEME.colors.text, marginTop: -THEME.spacing.xs },
  lead: { ...THEME.type.body, color: THEME.colors.textMuted },

  metrics: { flexDirection: 'row', gap: THEME.spacing.sm },
  metric: { flex: 1 },
  metricBody: { padding: THEME.spacing.sm, gap: 2 },
  metricLabel: { ...THEME.type.eyebrow, fontSize: 11, color: THEME.colors.onSignal },
  metricValue: { ...THEME.type.heading, color: THEME.colors.text },
  metricCaption: { ...THEME.type.caption, fontSize: 12, color: THEME.colors.textMuted },

  // Der Graph darf breiter sein als der Text daneben -- er ist das Schaustueck
  // dieses Tabs, nicht eine Abbildung darin. overflow: 'hidden' haelt den
  // gezoomten Graphen von den Kacheln darueber und darunter fern.
  graphWrap: {
    alignItems: 'center',
    marginHorizontal: -(THEME.spacing.md - GRAPH_MARGIN),
    overflow: 'hidden',
  },

  hint: { ...THEME.type.captionStrong, color: THEME.colors.textMuted, textAlign: 'center' },
});
