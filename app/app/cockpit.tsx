import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { headerInset, LargeTitleHeader } from "@/components/LargeTitleHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { PressableScale, tap } from "@/components/PressableScale";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSlop } from "@/engine/SlopProvider";
import { labById } from "@/engine/fixtures";
import { PaneCockpit } from "@/components/panes/PaneCockpit";
import { PaneQuests } from "@/components/panes/PaneQuests";
import { PaneGrid } from "@/components/panes/PaneGrid";

type PaneId = "cockpit" | "quests" | "grid";

const PANES: { value: PaneId; label: string }[] = [
  { value: "cockpit", label: "Cockpit" },
  { value: "quests", label: "Quests" },
  { value: "grid", label: "Cooling Grid" },
];

/**
 * Der Hauptscreen. Large Title kollabiert beim Scrollen, darunter das
 * Segmented Control über drei Panes. Jede Pane liegt in einer eigenen
 * ErrorBoundary — beim Community Voting darf eine einzelne Kachel nicht
 * die ganze App mitnehmen.
 */
export default function Cockpit() {
  const insets = useSafeAreaInsets();
  const { state } = useSlop();
  const [pane, setPane] = useState<PaneId>("cockpit");
  const scrollY = useSharedValue(0);

  // Ohne Lab gibt es keinen Spielstand — zurück zur Auswahl.
  useEffect(() => {
    if (!state.lab) router.replace("/");
  }, [state.lab]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  if (!state.lab) return null;
  const lab = labById(state.lab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <LargeTitleHeader
        title={lab.name}
        scrollY={scrollY}
        right={
          <PressableScale
            feel="select"
            scaleTo={0.9}
            onPress={() => {
              tap("select");
              router.push("/regie");
            }}
          >
            <Text style={[type.body, { color: colors.primary }]}>Regie</Text>
          </PressableScale>
        }
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: headerInset(insets.top),
          paddingBottom: insets.bottom + space.xxl,
        }}
      >
        <View style={{ marginBottom: space.lg }}>
          <SegmentedControl options={PANES} value={pane} onChange={setPane} />
        </View>

        {pane === "cockpit" ? (
          <ErrorBoundary label="cockpit">
            <PaneCockpit />
          </ErrorBoundary>
        ) : null}
        {pane === "quests" ? (
          <ErrorBoundary label="quests">
            <PaneQuests />
          </ErrorBoundary>
        ) : null}
        {pane === "grid" ? (
          <ErrorBoundary label="grid">
            <PaneGrid />
          </ErrorBoundary>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
}
