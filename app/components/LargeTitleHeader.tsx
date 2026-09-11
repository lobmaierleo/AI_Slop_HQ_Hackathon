import { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space } from "@/theme/tokens";
import { type } from "@/theme/type";

const COLLAPSE = 52;

/**
 * Die Large-Title-Navigationsleiste von iOS: 34px kollabiert beim Scrollen auf
 * eine zentrierte 17px-Zeile, dahinter blendet expo-blur ein, die Haarlinie
 * erscheint erst im kollabierten Zustand.
 */
export function LargeTitleHeader({
  title,
  scrollY,
  right,
}: {
  title: string;
  scrollY: SharedValue<number>;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  const chrome = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE - 18, COLLAPSE], [0, 1], Extrapolation.CLAMP),
  }));

  const compact = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE - 14, COLLAPSE + 6], [0, 1], Extrapolation.CLAMP),
  }));

  const large = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE - 10], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, COLLAPSE], [0, -10], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, chrome]}>
        {Platform.OS === "ios" ? (
          <BlurView tint="light" intensity={72} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]} />
        )}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.hairline,
          }}
        />
      </Animated.View>

      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            height: 44,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: space.md,
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={[type.bodyStrong, { flex: 1, textAlign: "center" }, compact]}
          >
            {title}
          </Animated.Text>
          {right ? (
            <View style={{ position: "absolute", right: space.md }}>{right}</View>
          ) : null}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[{ paddingHorizontal: space.md, paddingBottom: space.xs }, large]}
        >
          <Text numberOfLines={1} style={type.displayMd}>
            {title}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** Wie viel Platz der Inhalt oben freihalten muss. */
export function headerInset(topInset: number) {
  return topInset + 44 + 46;
}
