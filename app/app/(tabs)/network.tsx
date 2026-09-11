import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/GlassSurface';
import { Symbol } from '@/components/Symbol';
import { SynapseGraph } from '@/components/SynapseGraph';
import { EDGES, activeEdges } from '@/lib/net';
import { PHOTO_QUESTS, useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

export default function NetworkScreen() {
  const { completedQuestIds, savedWaterLiters, answeredTriviaIds, correctTriviaIds, completedPhotos } =
    useGameStore();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const size = width - THEME.spacing.md * 2;
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
          <Metric label="Synapsen" value={`${active}`} caption={`von ${EDGES.length}`} />
          <Metric
            label="Wasser"
            value={savedWaterLiters.toFixed(1).replace('.', ',')}
            caption="Liter gespart"
          />
          <Metric
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
          <GlassSurface radius={THEME.radius.lg} glow={unlocked} contentStyle={styles.detail}>
            <View style={styles.detailHead}>
              <View style={styles.badge}>
                <Symbol name={selected.symbol} size={17} color={THEME.colors.primary} />
              </View>
              <View style={styles.detailHeadText}>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailLocation}>{selected.location}</Text>
              </View>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={12}>
                <Symbol name="xmark" size={15} color={THEME.colors.textFaint} />
              </Pressable>
            </View>

            {unlocked ? (
              <>
                <View style={styles.proof}>
                  <Symbol
                    name={completedPhotos[selected.id] ? 'photo.fill' : 'checkmark.seal.fill'}
                    size={15}
                    color={THEME.colors.success}
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
          </GlassSurface>
        ) : (
          <Text style={styles.hint}>
            {completedQuestIds.length === 0
              ? 'Noch ist alles dunkel. Geh zum ersten Ort, dann beginnt das Netz zu leuchten.'
              : 'Tippe einen Knoten an, um zu sehen, was dort steht.'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <GlassSurface radius={THEME.radius.md} flat style={styles.metric} contentStyle={styles.metricBody}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
      <Text style={styles.metricCaption} numberOfLines={1}>
        {caption}
      </Text>
    </GlassSurface>
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
  eyebrow: { ...THEME.type.eyebrow, color: THEME.colors.primary },
  title: { ...THEME.type.title, color: THEME.colors.text, marginTop: -THEME.spacing.xs },
  lead: { ...THEME.type.body, color: THEME.colors.textMuted },

  metrics: { flexDirection: 'row', gap: THEME.spacing.sm },
  metric: { flex: 1 },
  metricBody: { padding: THEME.spacing.sm, gap: 2 },
  metricLabel: { ...THEME.type.eyebrow, fontSize: 11, color: THEME.colors.textFaint },
  metricValue: { ...THEME.type.heading, color: THEME.colors.text },
  metricCaption: { ...THEME.type.caption, fontSize: 12, color: THEME.colors.textFaint },

  graphWrap: { alignItems: 'center' },

  detail: { padding: THEME.spacing.md, gap: THEME.spacing.sm },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.sm },
  detailHeadText: { flex: 1 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { ...THEME.type.bodyStrong, color: THEME.colors.text },
  detailLocation: { ...THEME.type.caption, color: THEME.colors.textFaint },
  proof: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proofText: { ...THEME.type.caption, color: THEME.colors.success },
  fact: { ...THEME.type.body, color: THEME.colors.text },
  teaser: { ...THEME.type.body, color: THEME.colors.textMuted },
  detailFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.colors.hairline,
    paddingTop: THEME.spacing.sm,
  },
  source: { ...THEME.type.caption, color: THEME.colors.textFaint, flex: 1 },
  liters: { ...THEME.type.bodyStrong, color: THEME.colors.primary },
  litersMuted: { ...THEME.type.bodyStrong, color: THEME.colors.textFaint },
  hint: { ...THEME.type.caption, color: THEME.colors.textFaint, textAlign: 'center' },
});
