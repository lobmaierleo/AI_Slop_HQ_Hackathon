import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { colors, space } from "@/theme/tokens";

type Tone = "canvas" | "parchment" | "pearl" | "dark" | "black";

const fill: Record<Tone, string> = {
  canvas: colors.canvas,
  parchment: colors.canvasParchment,
  pearl: colors.surfacePearl,
  dark: colors.surfaceTile1,
  black: colors.surfaceBlack,
};

/**
 * Randlose Wechselkachel über die volle Breite. Nach DESIGN.md ist der
 * Flächenwechsel der Trenner — keine Linien, keine Rundungen, keine Verläufe,
 * kein Schatten.
 */
export function Surface({
  tone = "canvas",
  children,
  style,
  pad = true,
}: {
  tone?: Tone;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  pad?: boolean;
}) {
  return (
    <View
      style={[
        { backgroundColor: fill[tone] },
        pad && { paddingVertical: space.lg, paddingHorizontal: space.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
