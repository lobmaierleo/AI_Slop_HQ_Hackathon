import { router } from "expo-router";
import { Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { tabular, type } from "@/theme/type";
import { Surface } from "@/components/Surface";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge, fmt, fmt1, Meter, StatTile } from "@/components/Readouts";
import { GlitchText } from "@/components/GlitchText";
import { PressableScale } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";
import { chatter, labById, meta, trees as treeData } from "@/engine/fixtures";

/**
 * Die Slop-Pumpe. Ein Tap erzeugt Tokens, die Tokens ziehen Kühlwasser, das
 * Kühlwasser legt einen namentlich genannten Linzer Brunnen trocken. Diese
 * Kette ist der Kern der Demo und muss auf einem Screen sichtbar sein.
 */
export function PaneCockpit() {
  const { state, tap: pump, liters, agi, quality, drift, trees, fountains, currentQuest } =
    useSlop();
  const lab = labById(state.lab!);

  const active = fountains.find((f) => !f.dry) ?? fountains[fountains.length - 1];
  const dryCount = fountains.filter((f) => f.dry).length;
  const fillShare = active ? active.fillLiters / active.bufferLiters : 0;

  const line = chatter[lab.id]?.[state.tapCount % (chatter[lab.id]?.length || 1)] ?? "";

  return (
    <View>
      {/* AGI-Fortschritt: der Akzent gehört dieser Ebene allein */}
      <Surface tone="dark">
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <StatTile
            label="AGI-Fortschritt"
            value={fmt1(agi)}
            unit="%"
            size="hero"
            tone="onDark"
            style={{ flex: 1 }}
          />
          <Badge onDark>Immer 2 Jahre entfernt</Badge>
        </View>
        <View style={{ marginTop: space.md }}>
          <Meter progress={agi / 100} tone="agi" onDark height={8} />
        </View>
        <Text style={[type.caption, { color: colors.bodyMuted, marginTop: space.xs }]}>
          {fmt(state.tokens)} Slop-Tokens trainiert
        </Text>
      </Surface>

      {/* Die Pumpe */}
      <Surface tone="canvas">
        <PressableScale
          feel="heavy"
          scaleTo={0.95}
          onPress={pump}
          disabled={state.paused || state.paywallOpen}
          style={{
            backgroundColor: state.paused || state.paywallOpen ? colors.hairline : colors.primary,
            borderRadius: radius.lg,
            paddingVertical: space.lg,
            alignItems: "center",
          }}
        >
          <Text
            style={[
              type.tagline,
              {
                color:
                  state.paused || state.paywallOpen ? colors.inkMuted48 : colors.onPrimary,
              },
            ]}
          >
            {state.paused
              ? "Aus Sicherheitsgründen pausiert"
              : state.paywallOpen
                ? "Enterprise-Subscription erforderlich"
                : "Slop generieren"}
          </Text>
          <Text
            style={[
              type.caption,
              {
                color:
                  state.paused || state.paywallOpen ? colors.inkMuted48 : colors.onPrimary,
                marginTop: 2,
                opacity: 0.85,
              },
            ]}
          >
            +{fmt(lab.tapTokens)} Tokens · {fmt1(lab.tapTokens * meta.model.litersPerToken)} l
          </Text>
        </PressableScale>

        {line ? (
          <Text
            style={[
              type.caption,
              { color: colors.inkMuted48, marginTop: space.sm, fontStyle: "italic" },
            ]}
          >
            {lab.name}: „{line}“
          </Text>
        ) : null}
      </Surface>

      {/* Wasserverbrauch — monochrom, der Akzent bleibt der AGI vorbehalten */}
      <Surface tone="parchment">
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile label="Kühlwasser" value={fmt(liters)} unit="l" size="md" style={{ flex: 1 }} />
          <StatTile
            label="Brunnen trocken"
            value={`${dryCount}`}
            unit={`/ ${fountains.length}`}
            size="md"
            style={{ flex: 1 }}
          />
        </View>

        {active ? (
          <PressableScale
            feel="select"
            scaleTo={0.98}
            onPress={() => router.push(`/fountain/${encodeURIComponent(active.id)}`)}
            style={{
              marginTop: space.md,
              backgroundColor: colors.canvas,
              borderRadius: radius.lg,
              padding: space.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[type.bodyStrong, { flex: 1 }]} numberOfLines={1}>
                {active.name}
              </Text>
              {active.dry ? <Badge filled>Trockengelegt</Badge> : null}
            </View>
            <Text style={[type.caption, { color: colors.inkMuted48, marginTop: 2 }]}>
              kühlt {active.totalProjects} Festivalprojekte an {active.nodes.length} Orten
            </Text>
            <View style={{ marginTop: space.sm }}>
              <Meter progress={fillShare} tone="water" />
            </View>
            <Text
              style={[type.finePrint, tabular, { color: colors.inkMuted48, marginTop: space.xs }]}
            >
              {fmt(active.fillLiters)} von {fmt(active.bufferLiters)} l Puffer (modelliert)
            </Text>
          </PressableScale>
        ) : null}
      </Surface>

      {/* Kontext-Kollaps */}
      <Surface tone="canvas">
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <StatTile
            label="Datenqualität"
            value={fmt1(quality)}
            unit="%"
            size="md"
            style={{ flex: 1 }}
          />
          {drift >= lab.driftThreshold ? <Badge filled>Context Drift</Badge> : null}
        </View>
        <View style={{ marginTop: space.sm }}>
          <Meter progress={quality / 100} tone="quiet" />
        </View>

        <View
          style={{
            marginTop: space.md,
            backgroundColor: colors.canvasParchment,
            borderRadius: radius.lg,
            padding: space.md,
          }}
        >
          <Text
            style={[
              type.caption,
              {
                color: colors.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: space.xxs,
              },
            ]}
          >
            Letzter Trainingsdatensatz
          </Text>
          <GlitchText drift={drift >= lab.driftThreshold ? drift : 0}>
            {currentQuest.claim}
          </GlitchText>
          <PressableScale
            feel="select"
            scaleTo={0.97}
            onPress={() => router.push("/quest")}
            style={{ marginTop: space.sm }}
          >
            <Text style={[type.body, { color: colors.primary }]}>Herkunft prüfen</Text>
          </PressableScale>
        </View>
      </Surface>

      {/* Kompensation über den Baumkataster */}
      <InsetGroupedList
        header="Sekundär-Kompensation"
        footer={`Linzer Baumkataster: ${fmt(treeData.total)} Bäume, davon ${fmt(
          treeData.nearHauptplatz300m,
        )} im Radius 300 m um den Hauptplatz.`}
        style={{ marginTop: space.lg }}
      >
        <Row
          label="Bäume für die Abwärme"
          value={`${fmt(trees)}`}
          detail={`${fmt(treeData.litersPerTree)} l Gießbedarf je Baum und Saison`}
        />
        <Row
          label="CO₂-Bindung verloren"
          value={`${fmt(trees * treeData.co2PerTreeKg)} kg`}
          detail={`${treeData.co2PerTreeKg} kg je Baum und Jahr`}
        />
      </InsetGroupedList>
    </View>
  );
}
