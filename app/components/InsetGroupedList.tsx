import { Children, Fragment, ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { PressableScale } from "./PressableScale";

/**
 * Die Inset-Grouped-Liste aus iOS Einstellungen: Karte auf Pergament,
 * Radius lg, Haarlinien am Label eingerückt, ohne Schatten.
 */
export function InsetGroupedList({
  header,
  footer,
  children,
  style,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ paddingHorizontal: space.md }, style]}>
      {header ? (
        <Text
          style={[
            type.caption,
            {
              color: colors.inkMuted48,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: space.xs,
              marginLeft: space.xxs,
            },
          ]}
        >
          {header}
        </Text>
      ) : null}

      <View
        style={{
          backgroundColor: colors.canvas,
          borderRadius: radius.lg,
          overflow: "hidden",
        }}
      >
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: colors.hairline,
                  marginLeft: space.md,
                }}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>

      {footer ? (
        <Text
          style={[
            type.caption,
            { color: colors.inkMuted48, marginTop: space.xs, marginLeft: space.xxs },
          ]}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

/** Eine Zeile in der Liste. Mit onPress wird sie zur Zielfläche. */
export function Row({
  label,
  value,
  detail,
  onPress,
  accessory,
  tone = "ink",
}: {
  label: string;
  value?: string;
  detail?: string;
  onPress?: () => void;
  accessory?: ReactNode;
  tone?: "ink" | "accent" | "muted";
}) {
  const labelColor =
    tone === "accent" ? colors.primary : tone === "muted" ? colors.inkMuted48 : colors.ink;

  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.md,
        paddingVertical: space.sm + 2,
        minHeight: 44,
      }}
    >
      <View style={{ flex: 1, paddingRight: space.sm }}>
        <Text style={[type.body, { color: labelColor }]}>{label}</Text>
        {detail ? (
          <Text style={[type.caption, { color: colors.inkMuted48, marginTop: 1 }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[type.body, { color: colors.inkMuted48 }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {accessory}
      {onPress && !accessory ? <Chevron /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} feel="select" scaleTo={0.98}>
      {body}
    </PressableScale>
  );
}

/** Das Disclosure-Chevron. Als Glyphe, damit es ohne Icon-Paket auskommt. */
export function Chevron() {
  return (
    <Text
      style={{
        color: colors.surfaceChipTranslucent,
        fontSize: 17,
        fontWeight: "600",
        marginLeft: space.xs,
      }}
    >
      ›
    </Text>
  );
}
