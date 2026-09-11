import { useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";
import { PressableScale, tap } from "./PressableScale";

/**
 * Von Hand gebaut, weil Expo Go nur Native-Module aus dem SDK lädt —
 * @react-native-segmented-control würde in der Preview nicht starten.
 * Die gleitende Pille folgt einer Federkurve, wie auf iOS.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = width > 0 ? (width - 4) / options.length : 0;

  const x = useDerivedValue(() => withSpring(index * slot, {
    damping: 20,
    stiffness: 220,
    mass: 0.6,
  }), [index, slot]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: "row",
        backgroundColor: colors.hairline,
        borderRadius: radius.sm,
        padding: 2,
        marginHorizontal: space.md,
      }}
    >
      {slot > 0 ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 2,
              left: 2,
              bottom: 2,
              width: slot,
              backgroundColor: colors.canvas,
              borderRadius: radius.xs + 1,
            },
            pill,
          ]}
        />
      ) : null}

      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            scaleTo={0.97}
            feel="none"
            onPress={() => {
              if (!active) tap("select");
              onChange(o.value);
            }}
            style={{
              flex: 1,
              paddingVertical: space.xs - 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                active ? type.captionStrong : type.buttonUtility,
                { color: active ? colors.ink : colors.inkMuted80 },
              ]}
            >
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
