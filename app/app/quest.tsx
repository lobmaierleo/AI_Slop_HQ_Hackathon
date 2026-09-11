import { Linking, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge } from "@/components/Readouts";
import { PressableScale } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";

/**
 * Herkunfts-Sheet. Zeigt für die aktuelle Halluzination, aus welchen echten
 * Datensätzen sie zusammengesetzt ist. Das ist der Beleg für Hackathon-Regel 2:
 * die Verbindung existiert nur, weil beide Datenwelten vorliegen.
 */
export default function QuestSheet() {
  const { currentQuest } = useSlop();
  const p = currentQuest.provenance;

  const open = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvasParchment }}
      contentContainerStyle={{ paddingTop: space.lg, paddingBottom: space.xxl }}
    >
      <View style={{ paddingHorizontal: space.md, marginBottom: space.lg }}>
        <Badge filled>Synthetischer Trainingsdatensatz</Badge>
        <Text style={[type.lead, { marginTop: space.sm }]}>{currentQuest.claim}</Text>
      </View>

      <View style={{ paddingHorizontal: space.md, marginBottom: space.lg }}>
        <View
          style={{
            backgroundColor: colors.canvas,
            borderRadius: radius.lg,
            padding: space.md,
          }}
        >
          <Text
            style={[
              type.captionStrong,
              {
                color: colors.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: space.xxs,
              },
            ]}
          >
            Was davon stimmt
          </Text>
          <Text style={type.body}>{currentQuest.truth}</Text>
        </View>
      </View>

      <InsetGroupedList
        header="Linz Open Data"
        footer="Straßennamen der Stadt Linz, angereichert mit Wikidata. Personen ohne Wikidata-Eintrag, Politiker, Militärs und alle NS-Bezüge sind in der Pipeline ausgeschlossen."
      >
        <Row label="Straße" value={p.street} />
        <Row label="Katastralgemeinde" value={p.district} />
        <Row label="Benannt nach" value={p.person} detail={`${p.beruf} · ${p.lebens}`} />
        {p.wikidata ? (
          <Row label="Wikidata" tone="accent" onPress={() => open(p.wikidata)} />
        ) : null}
      </InsetGroupedList>

      <InsetGroupedList
        header="Festival-Programmdatensatz"
        footer="Projekte werden über Linked Location ihrem Festivalort zugeordnet. Nicht jedes Projekt hat einen auflösbaren Ort — die Pipeline überspringt die übrigen, statt zu raten."
        style={{ marginTop: space.lg }}
      >
        <Row label="Projekt" value={p.project} />
        <Row label="Standort" value={p.location} />
        {p.projectLink ? (
          <Row label="Projektseite" tone="accent" onPress={() => open(p.projectLink)} />
        ) : null}
      </InsetGroupedList>

      <InsetGroupedList
        header="Der Join"
        footer="Haversine-Distanz vom Festivalort zum nächstgelegenen Linzer Trinkbrunnen. Diese Zuordnung bestimmt, welcher Brunnen beim Training trockenfällt."
        style={{ marginTop: space.lg }}
      >
        <Row label="Nächster Trinkbrunnen" value={p.fountain} />
        <Row label="Distanz" value={`${p.distanceM} m`} />
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
