import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { tabular, type } from "@/theme/type";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge, fmt, Meter } from "@/components/Readouts";
import { PressableScale } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";
import { meta } from "@/engine/fixtures";

/**
 * Brunnen-Detail als Sheet. Listet die Festivalorte auf, für die genau dieser
 * Trinkbrunnen der nächstgelegene ist — der eigentliche strukturelle Join.
 */
export default function FountainSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fountains } = useSlop();
  const f = fountains.find((x) => x.id === decodeURIComponent(id ?? ""));

  if (!f) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment, padding: space.md }}>
        <Text style={type.body}>Dieser Brunnen ist nicht in der Fixture.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvasParchment }}
      contentContainerStyle={{ paddingTop: space.lg, paddingBottom: space.xxl }}
    >
      <View style={{ paddingHorizontal: space.md, marginBottom: space.lg }}>
        {f.dry ? <Badge filled>Trockengelegt / Kritisch</Badge> : <Badge>In Betrieb</Badge>}
        <Text style={[type.displayMd, { marginTop: space.xs }]}>{f.name}</Text>
        <Text style={[type.caption, { color: colors.inkMuted48 }]}>
          {f.kind}
          {f.build ? ` · ${f.build}` : ""}
        </Text>

        <View style={{ marginTop: space.md }}>
          <Meter progress={f.fillLiters / f.bufferLiters} tone={f.dry ? "faint" : "water"} height={8} />
        </View>
        <Text style={[type.caption, tabular, { color: colors.inkMuted48, marginTop: space.xs }]}>
          {fmt(f.fillLiters)} von {fmt(f.bufferLiters)} l Puffer
        </Text>
      </View>

      <InsetGroupedList
        header="Kühllast"
        footer="Jeder dieser Festivalorte hat diesen Brunnen als nächstgelegenen. Die Zahl der Projekte bestimmt, wie früh er in der Simulation trockenfällt."
      >
        <Row label="Festivalprojekte" value={`${f.totalProjects}`} />
        <Row label="Festivalorte" value={`${f.nodes.length}`} />
      </InsetGroupedList>

      <InsetGroupedList header="Zugeordnete Orte" style={{ marginTop: space.lg }}>
        {f.nodes.slice(0, 12).map((n) => (
          <Row
            key={n.locId}
            label={n.name}
            value={`${n.projects} Proj.`}
            detail={`${n.area ? `${n.area} · ` : ""}${fmt(n.distanceM)} m entfernt`}
          />
        ))}
      </InsetGroupedList>

      <InsetGroupedList
        header="Datenlage"
        footer={`${meta.model.note} ${meta.model.vintage}. Das Sammelbecken-Feld der Stadt Linz meldet für fast alle Brunnen „keine“ — der Puffer ist deshalb eine Modellkonstante, kein Messwert.`}
        style={{ marginTop: space.lg }}
      >
        <Row label="Puffer (modelliert)" value={`${fmt(f.bufferLiters)} l`} />
        <Row
          label="Sammelbecken laut Datensatz"
          value={f.basinLiters ? `${fmt(f.basinLiters)} l` : "keine Angabe"}
        />
        <Row label="Koordinaten" value={`${f.lat.toFixed(4)}, ${f.lon.toFixed(4)}`} />
      </InsetGroupedList>

      <View style={{ paddingHorizontal: space.md, marginTop: space.lg }}>
        <PressableScale
          feel="medium"
          scaleTo={0.96}
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.canvas,
            borderRadius: radius.lg,
            paddingVertical: space.sm + 2,
            alignItems: "center",
          }}
        >
          <Text style={[type.bodyStrong, { color: colors.primary }]}>Schließen</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}
