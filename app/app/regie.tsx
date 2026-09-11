import { router } from "expo-router";
import { ScrollView, Switch, Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge, fmt } from "@/components/Readouts";
import { PressableScale, tap } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";
import { meta } from "@/engine/fixtures";

/**
 * Präsentationsmodus. Beim Pitch bleiben keine Hände frei, um zu tippen:
 * dieser Schalter lässt die Simulation selbst hochlaufen und die Ereignisse
 * von allein eintreten. Dazu die beiden Notknöpfe für den Vortrag.
 */
export default function Regie() {
  const {
    state,
    setPresentation,
    triggerCollapse,
    reset,
    resume,
    dismissPaywall,
    liters,
    trees,
  } = useSlop();

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvasParchment }}
      contentContainerStyle={{ paddingTop: space.lg, paddingBottom: space.xxl }}
    >
      <View style={{ paddingHorizontal: space.md, marginBottom: space.lg }}>
        <Text style={type.displayMd}>Regie</Text>
        <Text style={[type.caption, { color: colors.inkMuted48 }]}>
          Steuerung für den Pitch. Nichts davon ruft das Netz.
        </Text>
      </View>

      <InsetGroupedList
        header="Präsentation"
        footer="Im Präsentationsmodus generiert die App alle 700 ms selbst Slop und löst die Erzählereignisse der Reihe nach aus."
      >
        <Row
          label="Automatisch trainieren"
          accessory={
            <Switch
              value={state.presentation}
              onValueChange={(v) => {
                tap("medium");
                setPresentation(v);
              }}
              trackColor={{ true: colors.primary, false: colors.hairline }}
            />
          }
        />
      </InsetGroupedList>

      <InsetGroupedList header="Eingriffe" style={{ marginTop: space.lg }}>
        <Row
          label="Model Collapse auslösen"
          tone="accent"
          onPress={() => {
            tap("heavy");
            triggerCollapse();
          }}
        />
        {state.paused ? (
          <Row label="Selbstsperre aufheben" tone="accent" onPress={resume} />
        ) : null}
        {state.paywallOpen ? (
          <Row label="Paywall schließen" tone="accent" onPress={dismissPaywall} />
        ) : null}
        <Row
          label="Rennen zurücksetzen"
          tone="accent"
          onPress={() => {
            tap("heavy");
            reset();
          }}
        />
        <Row label="Lab wechseln" tone="accent" onPress={() => router.replace("/")} />
      </InsetGroupedList>

      <InsetGroupedList header="Aktueller Stand" style={{ marginTop: space.lg }}>
        <Row label="Tokens" value={fmt(state.tokens)} />
        <Row label="Kühlwasser" value={`${fmt(liters)} l`} />
        <Row label="Bäume" value={fmt(trees)} />
        <Row label="Taps" value={fmt(state.tapCount)} />
      </InsetGroupedList>

      <InsetGroupedList
        header="Ereignisprotokoll"
        footer="Die letzten Ereignisse der Simulation, neueste zuerst."
        style={{ marginTop: space.lg }}
      >
        {state.events.length === 0 ? (
          <Row label="Noch keine Ereignisse" tone="muted" />
        ) : (
          state.events.slice(0, 8).map((e) => <Row key={e.id} label={e.text} tone="muted" />)
        )}
      </InsetGroupedList>

      <View style={{ paddingHorizontal: space.md, marginTop: space.lg }}>
        <Badge>Fixture vom {meta.generatedAt.slice(0, 10)} · Seed {meta.seed}</Badge>
        <Text style={[type.finePrint, { color: colors.inkMuted48, marginTop: space.xs }]}>
          {fmt(meta.counts.quests ?? 0)} Halluzinationen, {fmt(meta.counts.pairs ?? 0)} Paare,{" "}
          {fmt(meta.counts.persons ?? 0)} Personen, {fmt(meta.counts.fountains ?? 0)} Brunnen mit
          Kühllast. Alles vorberechnet, kein LLM-Call im Demo-Pfad.
        </Text>
      </View>

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
