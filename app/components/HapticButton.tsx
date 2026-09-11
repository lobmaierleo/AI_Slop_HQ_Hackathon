import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

function fire(kind: HapticKind) {
  switch (kind) {
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case 'selection':
      return Haptics.selectionAsync();
    case 'heavy':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    default:
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

type Props = {
  onPress?: () => void;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  disabled?: boolean;
  scaleTo?: number;
  accessibilityLabel?: string;
};

/** Bouncy Touch-Target: Haptik sofort beim Drücken, Feder-Skalierung auf 0.96. */
export function HapticButton({
  onPress,
  haptic = 'light',
  style,
  children,
  disabled,
  scaleTo = 0.96,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        spring(scaleTo);
        fire(haptic).catch(() => {});
      }}
      onPressOut={() => spring(1)}
      onPress={disabled ? undefined : onPress}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default HapticButton;
