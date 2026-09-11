import { useCallback } from "react";
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type Feel = "light" | "medium" | "heavy" | "select" | "none";

/** Haptik nur auf Geräten. Auf Web ist die API nicht vorhanden. */
export function tap(feel: Feel = "light") {
  if (Platform.OS === "web" || feel === "none") return;
  if (feel === "select") {
    Haptics.selectionAsync().catch(() => {});
    return;
  }
  const style = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  }[feel];
  Haptics.impactAsync(style).catch(() => {});
}

export function notify(kind: "success" | "warning" | "error") {
  if (Platform.OS === "web") return;
  const t = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  }[kind];
  Haptics.notificationAsync(t).catch(() => {});
}

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Wie stark der Druck sich anfühlt. */
  feel?: Feel;
  /** Kleiner Zielflächen brauchen weniger Skalierung, sonst wirkt es billig. */
  scaleTo?: number;
};

/**
 * Der Druckzustand aus DESIGN.md: transform scale(0.95).
 * Kein Opacity-Fade, kein Schatten — nur die Skalierung.
 */
export function PressableScale({
  style,
  feel = "light",
  scaleTo = 0.95,
  onPressIn,
  ...rest
}: Props) {
  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      tap(feel);
      onPressIn?.(e);
    },
    [feel, onPressIn],
  );

  return (
    <Pressable
      onPressIn={handleIn}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: scaleTo }] },
      ]}
      {...rest}
    />
  );
}
