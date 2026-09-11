import { router } from "expo-router";
import { Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { tabular, type } from "@/theme/type";
import { Surface } from "@/components/Surface";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge, fmt, Meter } from "@/components/Readouts";
import { PressableScale } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";
import { labById, meta } from "@/engine/fixtures";

/**
 * Cooling Grid und Leaderboard. Die Reihenfolge der Brunnen kommt aus der
 * Pipeline: sortiert nach Kühllast, also nach der Zahl der Festivalprojekte,
 * für die dieser Brunnen der nächstgelegene ist. Sie ist datengetrieben,
 * nicht erfunden.
 */
export function PaneGrid() {
  const { state, fountains, standings, liters } = useSlop();

  return (
    <View>
      {/* Leaderboard */}
      <InsetGroupedList
        header="Das Rennen"
        footer="Rivalen werden lokal simuliert, mit festem Seed. Jede Demo verläuft gleich."
      >
        {standings.map((s) => {
          const lab = labById(s.id);
          const mine = s.id === state.lab;
          return (
            <Row
              key={s.id}
              label={`${s.rank}. ${lab.name}`}
              value={fmt(s.tokens)}
              detail={mine ? "dein Lab" : lab.tone}
              tone={mine ? "accent" : "ink"}
            />
          );
        })}
      </InsetGroupedList>

      {/* Gesamtverbrauch */}
      <Surface tone="dark" style={{ marginTop: space.lg }}>
        <Text
          style={[
            type.captionStrong,
            {
              color: colors.bodyMuted,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: space.xxs,
            },
          ]}
        >
          Kühlwasser gesamt
        </Text>
        <Text style={[type.displayLg, tabular, { color: colors.bodyOnDark }]}>
          {fmt(liters)} l
        </Text>
        <Text style={[type.caption, { color: colors.bodyMuted, marginTop: space.xxs }]}>
          {fountains.filter((f) => f.dry).length} von {fountains.length} Brunnen trockengelegt ·
          modelliert mit {meta.model.litersPerToken} l je Token
        </Text>
      </Surface>

      {/* Die Brunnen in Lastreihenfolge */}
      <View style={{ marginTop: space.lg, paddingHorizontal: space.md }}>
        <Text
          style={[
            type.caption,
            {
              color: colors.inkMuted48,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: space.xs,
              marginLeft: space.xxs,
            },
          ]}
        >
          Cooling Grid · {fountains.length} Brunnen
        </Text>

        {fountains.map((f) => (
          <PressableScale
            key={f.id}
            feel="select"
            scaleTo={0.98}
            onPress={() => router.push(`/fountain/${encodeURIComponent(f.id)}`)}
            style={{
              backgroundColor: colors.canvas,
              borderRadius: radius.lg,
              padding: space.md,
              marginBottom: space.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[type.bodyStrong, { flex: 1 }]} numberOfLines={1}>
                {f.name}
              </Text>
              {f.dry ? <Badge filled>Trockengelegt</Badge> : null}
            </View>

            <Text style={[type.caption, { color: colors.inkMuted48, marginTop: 2 }]}>
              {f.totalProjects} Projekte · {f.nodes.length} Festivalorte · {f.kind}
            </Text>

            <View style={{ marginTop: space.sm }}>
              <Meter progress={f.fillLiters / f.bufferLiters} tone={f.dry ? "faint" : "water"} />
            </View>

            <Text
              style={[type.finePrint, tabular, { color: colors.inkMuted48, marginTop: space.xs }]}
            >
              {fmt(f.fillLiters)} / {fmt(f.bufferLiters)} l · nächster Ort: {f.nodes[0]?.name} (
              {fmt(f.nodes[0]?.distanceM ?? 0)} m)
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={{ paddingHorizontal: space.md, marginTop: space.sm }}>
        <Text style={[type.finePrint, { color: colors.inkMuted48 }]}>
          {meta.model.note} {meta.model.vintage}
        </Text>
      </View>
    </View>
  );
}
