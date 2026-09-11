import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { Surface } from "@/components/Surface";
import { PressableScale, tap } from "@/components/PressableScale";
import { Badge } from "@/components/Readouts";
import { useSlop } from "@/engine/SlopProvider";
import { labs } from "@/engine/fixtures";
import type { LabId } from "@/engine/types";

/**
 * Lab-Onboarding. Vier Kacheln, randlos im Wechsel canvas/parchment nach
 * DESIGN.md — kein Karten-Look, keine Schatten. Der Slogan trägt die Satire,
 * der Malus-Text erklärt die Mechanik, bevor sie im Cockpit zuschlägt.
 */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { join } = useSlop();
  const [selected, setSelected] = useState<LabId | null>(null);

  const start = (id: LabId) => {
    tap("medium");
    setSelected(id);
    join(id);
    router.replace("/cockpit");
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvasParchment }}
      contentContainerStyle={{ paddingTop: insets.top + space.xl, paddingBottom: space.xxl }}
    >
      <View style={{ paddingHorizontal: space.md, marginBottom: space.lg }}>
        <Badge>Ars Electronica 2026 · Negotiating Humanity</Badge>
        <Text style={[type.heroDisplay, { marginTop: space.sm }]}>AI SLOPPY</Text>
        <Text style={[type.body, { color: colors.inkMuted48, marginTop: space.xxs }]}>
          The Great Linz Compute &amp; Cooling Crisis. Wähle dein Lab und trainiere Richtung
          „AGI“ — auf Kosten der Linzer Trinkbrunnen.
        </Text>
      </View>

      {labs.map((lab) => (
        <PressableScale
          key={lab.id}
          feel="medium"
          scaleTo={0.97}
          onPress={() => start(lab.id as LabId)}
          style={{ marginBottom: 2 }}
        >
          <Surface tone={selected === lab.id ? "dark" : "canvas"}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    type.tagline,
                    { color: selected === lab.id ? colors.bodyOnDark : colors.ink },
                  ]}
                >
                  {lab.name}
                </Text>
                <Text
                  style={[
                    type.caption,
                    {
                      color: selected === lab.id ? colors.bodyMuted : colors.inkMuted48,
                      marginTop: 2,
                      fontStyle: "italic",
                    },
                  ]}
                >
                  „{lab.slogan}“
                </Text>
                <Text
                  style={[
                    type.caption,
                    {
                      color: selected === lab.id ? colors.bodyMuted : colors.inkMuted80,
                      marginTop: space.xs,
                    },
                  ]}
                >
                  {lab.malus}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: radius.pill,
                  width: 30,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    selected === lab.id ? colors.primaryOnDark : colors.canvasParchment,
                  marginLeft: space.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: selected === lab.id ? colors.surfaceBlack : colors.inkMuted48,
                  }}
                >
                  {lab.name[0]}
                </Text>
              </View>
            </View>
          </Surface>
        </PressableScale>
      ))}

      <View style={{ paddingHorizontal: space.md, marginTop: space.lg }}>
        <Text style={[type.finePrint, { color: colors.inkMuted48 }]}>
          Modelliert: 1 Slop-Token = 0,008 l Kühlwasser. Trinkbrunnen-Daten der Stadt Linz,
          Stand Juli 2023 — kein Live-Betriebsstatus.
        </Text>
      </View>
    </ScrollView>
  );
}
