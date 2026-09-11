import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { Surface } from "@/components/Surface";
import { InsetGroupedList, Row } from "@/components/InsetGroupedList";
import { Badge, fmt } from "@/components/Readouts";
import { PressableScale, notify, tap } from "@/components/PressableScale";
import { useSlop } from "@/engine/SlopProvider";
import { pairs, questPool } from "@/engine/fixtures";

type Verdict = { correct: boolean; truth: string } | null;

/**
 * Mini-Game „Slop or Real Art“. Beide Texte sind echt vorberechnet: links ein
 * Projektteaser aus dem Festival-Export, rechts eine Halluzination aus einem
 * Linzer Straßennamen. Das Publikum liegt zuverlässig daneben — das ist die
 * Pointe, und sie belegt den Daten-Join.
 */
export function PaneQuests() {
  const { state } = useSlop();
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [score, setScore] = useState({ hits: 0, tries: 0 });

  const pair = pairs.length > 0 ? pairs[index % pairs.length] : null;

  // Die Reihenfolge steckt in der Fixture, damit sie pro Paar stabil bleibt.
  const [first, second] = useMemo(() => {
    if (!pair) return [null, null] as const;
    return pair.realFirst
      ? ([
          { kind: "real" as const, text: pair.real.text },
          { kind: "slop" as const, text: pair.slop.text },
        ] as const)
      : ([
          { kind: "slop" as const, text: pair.slop.text },
          { kind: "real" as const, text: pair.real.text },
        ] as const);
  }, [pair]);

  const answer = (kind: "real" | "slop") => {
    if (!pair || verdict) return;
    const correct = kind === "real";
    notify(correct ? "success" : "error");
    setVerdict({
      correct,
      truth: correct
        ? `Richtig. „${pair.real.project}“ läuft tatsächlich am Standort ${pair.real.location}.`
        : pair.slop.truth,
    });
    setScore((s) => ({ hits: s.hits + (correct ? 1 : 0), tries: s.tries + 1 }));
  };

  const next = () => {
    tap("light");
    setVerdict(null);
    setIndex((i) => i + 1);
  };

  return (
    <View>
      <Surface tone="canvas">
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.sm }}>
          <Text style={[type.tagline, { flex: 1 }]}>Slop or Real Art?</Text>
          <Badge>
            {score.hits} / {score.tries} richtig
          </Badge>
        </View>
        <Text style={[type.caption, { color: colors.inkMuted48 }]}>
          Einer der beiden Texte beschreibt ein echtes Projekt des Ars Electronica Festivals
          2026. Der andere ist synthetischer Slop aus einem Linzer Straßennamen.
        </Text>
      </Surface>

      {pair && first && second ? (
        <>
          {[first, second].map((opt, i) => {
            const revealed = verdict !== null;
            const isReal = opt.kind === "real";
            return (
              <PressableScale
                key={`${pair.id}-${i}`}
                feel="medium"
                scaleTo={0.97}
                disabled={revealed}
                onPress={() => answer(opt.kind)}
                style={{ marginTop: 2 }}
              >
                <Surface tone={revealed && isReal ? "dark" : "parchment"}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                    <Text
                      style={[
                        type.captionStrong,
                        {
                          flex: 1,
                          color: revealed && isReal ? colors.bodyMuted : colors.inkMuted48,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        },
                      ]}
                    >
                      Text {String.fromCharCode(65 + i)}
                    </Text>
                    {revealed ? (
                      <Badge filled onDark={isReal}>
                        {isReal ? "Echtes Projekt" : "Slop"}
                      </Badge>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      type.body,
                      { color: revealed && isReal ? colors.bodyOnDark : colors.ink },
                    ]}
                  >
                    {opt.text}
                  </Text>
                </Surface>
              </PressableScale>
            );
          })}

          {verdict ? (
            <Surface tone="canvas">
              <Text style={[type.bodyStrong, { marginBottom: space.xxs }]}>
                {verdict.correct ? "Erkannt." : "Reingefallen."}
              </Text>
              <Text style={[type.body, { color: colors.inkMuted80 }]}>{verdict.truth}</Text>
              <PressableScale
                feel="medium"
                scaleTo={0.96}
                onPress={next}
                style={{
                  marginTop: space.md,
                  backgroundColor: colors.primary,
                  borderRadius: radius.lg,
                  paddingVertical: space.sm + 2,
                  alignItems: "center",
                }}
              >
                <Text style={[type.bodyStrong, { color: colors.onPrimary }]}>
                  Nächstes Paar
                </Text>
              </PressableScale>
            </Surface>
          ) : null}
        </>
      ) : (
        <Surface tone="canvas">
          <Text style={[type.body, { color: colors.inkMuted48 }]}>
            Keine Paare in der Fixture.
          </Text>
        </Surface>
      )}

      <InsetGroupedList
        header="Trainingsdaten in der Warteschlange"
        footer={`${fmt(questPool.length)} vorberechnete Halluzinationen. Jede trägt ihre Herkunft mit: Straße, Person, Projekt, Standort, Brunnen.`}
        style={{ marginTop: space.lg }}
      >
        {questPool.slice(state.questIndex, state.questIndex + 6).map((q) => (
          <Row
            key={q.id}
            label={q.provenance.person}
            detail={`${q.provenance.street} · ${q.provenance.project}`}
            onPress={() => router.push("/quest")}
          />
        ))}
      </InsetGroupedList>
    </View>
  );
}
