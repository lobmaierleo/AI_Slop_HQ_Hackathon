import { ReactNode } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";
import { colors, dataTone, radius, space } from "@/theme/tokens";
import { tabular, type } from "@/theme/type";

const de = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 0 });
const de1 = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 });

export const fmt = (n: number) => de.format(Math.round(n));
export const fmt1 = (n: number) => de1.format(n);

/** Große Kennzahl mit Label darunter. */
export function StatTile({
  label,
  value,
  unit,
  size = "lg",
  tone = "ink",
  style,
}: {
  label: string;
  value: string;
  unit?: string;
  size?: "lg" | "md" | "hero";
  tone?: "ink" | "accent" | "onDark";
  style?: StyleProp<ViewStyle>;
}) {
  const numStyle: TextStyle =
    size === "hero" ? type.heroDisplay : size === "lg" ? type.displayLg : type.displayMd;
  const color =
    tone === "accent" ? colors.primary : tone === "onDark" ? colors.bodyOnDark : colors.ink;
  const labelColor = tone === "onDark" ? colors.bodyMuted : colors.inkMuted48;

  return (
    <View style={style}>
      <Text
        style={[
          type.captionStrong,
          {
            color: labelColor,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: space.xxs,
          },
        ]}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={[numStyle, tabular, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? (
          <Text style={[type.tagline, { color: labelColor, marginLeft: space.xs }]}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Fortschrittsbalken. Der Akzent ist dem AGI-Fortschritt vorbehalten,
 * alles andere läuft über die Graustufen — Auslegung aus DESIGN.md.
 */
export function Meter({
  progress,
  tone = "agi",
  height = 6,
  onDark = false,
}: {
  progress: number;
  tone?: keyof typeof dataTone;
  height?: number;
  onDark?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const w = useDerivedValue(
    () => withSpring(clamped, { damping: 22, stiffness: 140, mass: 0.7 }),
    [clamped],
  );
  const bar = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: onDark ? colors.inkMuted80 : colors.hairline,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            borderRadius: radius.pill,
            backgroundColor: onDark && tone === "agi" ? colors.primaryOnDark : dataTone[tone],
          },
          bar,
        ]}
      />
    </View>
  );
}

/**
 * Alarmzustand monochrom. DESIGN.md erlaubt genau einen Akzent, deshalb
 * signalisiert ein gefülltes schwarzes Badge die Eskalation — nicht eine
 * zweite Farbe.
 */
export function Badge({
  children,
  filled = false,
  onDark = false,
}: {
  children: ReactNode;
  filled?: boolean;
  onDark?: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: space.xs,
        paddingVertical: 3,
        borderRadius: radius.xs,
        backgroundColor: filled
          ? onDark
            ? colors.bodyOnDark
            : colors.ink
          : onDark
            ? colors.inkMuted80
            : colors.canvasParchment,
      }}
    >
      <Text
        style={[
          type.microLegal,
          {
            fontWeight: "700",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: filled
              ? onDark
                ? colors.ink
                : colors.onPrimary
              : onDark
                ? colors.bodyMuted
                : colors.inkMuted48,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
