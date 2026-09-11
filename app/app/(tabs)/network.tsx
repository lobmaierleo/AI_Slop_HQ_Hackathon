import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutSurface, type Tone } from '@/components/BrutSurface';
import { Symbol } from '@/components/Symbol';
import { SynapseGraph } from '@/components/SynapseGraph';
import { EDGES, activeEdges } from '@/lib/net';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

/** Seitliche Luft des Graphen -- er darf breiter sein als der Fliesstext. */
const GRAPH_MARGIN = THEME.spacing.xs;

export default function NetworkScreen() {
  const { completedQuestIds, savedWaterLiters, answeredTriviaIds, correctTriviaIds, completedPhotos } =
    useGameStore();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const size = width - GRAPH_MARGIN * 2;
  const active = useMemo(() => activeEdges(completedQuestIds).length, [completedQuestIds]);

  // Ohne Antwort gibt es keine Quote. 100 % bei null Versuchen waere gelogen.
  const autonomy = answeredTriviaIds.length
    ? Math.round((correctTriviaIds.length / answeredTriviaIds.length) * 100)
    : null;

  const selected = selectedId ? PHOTO_QUESTS.find((q) => q.id === selectedId) : undefined;
  const unlocked = selectedId ? completedQuestIds.includes(selectedId) : false;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              autonomy === null ? 'noch offen' : `${correctTriviaIds.length}/${answeredTriviaIds.length} richtig`
            }
          />
        </View>

        <View style={styles.graphWrap}>
          <SynapseGraph
            size={size}
            completedIds={completedQuestIds}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </View>

        {selected ? (
          <BrutSurface radius={THEME.radius.md} contentStyle={styles.detail}>
            <View style={styles.detailHead}>
              <View style={[styles.badge, unlocked && styles.badgeDone]}>
                <Symbol name={selected.symbol} size={17} color={THEME.colors.ink} />
              </View>
              <View style={styles.detailHeadText}>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailLocation}>{selected.location}</Text>
              </View>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={12} style={styles.close}>
                <Symbol name="xmark" size={15} color={THEME.colors.ink} />
              </Pressable>
            </View>

            {unlocked ? (
              <>
                <View style={styles.proof}>
                  <Symbol
                    name={completedPhotos[selected.id] ? 'photo.fill' : 'checkmark.seal.fill'}
                    size={15}
                    color={THEME.colors.ink}
                  />
                  <Text style={styles.proofText}>Vor Ort bestätigt</Text>
                </View>
                <Text style={styles.fact}>{selected.fact}</Text>
                <View style={styles.detailFoot}>
                  <Text style={styles.source}>{selected.source}</Text>
                  <Text style={styles.liters}>
                    +{selected.waterLiters.toFixed(1).replace('.', ',')} L
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.teaser}>{selected.teaser}</Text>
                <View style={styles.detailFoot}>
                  <Text style={styles.source}>Noch nicht entdeckt</Text>
                  <Text style={styles.litersMuted}>
                    {selected.waterLiters.toFixed(1).replace('.', ',')} L möglich
                  </Text>
                </View>
              </>
            )}
          </BrutSurface>
        ) : (
          <Text style={styles.hint}>
            {completedQuestIds.length === 0
              ? 'Noch ist jeder Knoten ein leerer Umriss. Geh zum ersten Ort, dann bekommt er Form und Farbe.'
              : 'Tippe einen Knoten an, um zu sehen, was dort steht.'}
          </Text>
        )}
      </ScrollView>
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
  // dieses Tabs, nicht eine Abbildung darin.
  graphWrap: {
    alignItems: 'center',
    marginHorizontal: -(THEME.spacing.md - GRAPH_MARGIN),
  },

  detail: { padding: THEME.spacing.md, gap: THEME.spacing.sm },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.sm },
  detailHeadText: { flex: 1 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: THEME.colors.success },
  close: {
    width: 30,
    height: 30,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  detailLocation: { ...THEME.type.caption, color: THEME.colors.textMuted },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.success,
  },
  proofText: { ...THEME.type.captionStrong, color: THEME.colors.onSignal },
  fact: { ...THEME.type.body, color: THEME.colors.text },
  teaser: { ...THEME.type.body, color: THEME.colors.textMuted },
  detailFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: THEME.border.thin,
    borderTopColor: THEME.border.color,
    paddingTop: THEME.spacing.sm,
  },
  source: { ...THEME.type.caption, color: THEME.colors.textMuted, flex: 1 },
  liters: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  litersMuted: { ...THEME.type.bodyStrong, color: THEME.colors.textFaint },
  hint: { ...THEME.type.captionStrong, color: THEME.colors.textMuted, textAlign: 'center' },
});
