import { useRef, useState } from 'react';
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
  /**
   * Als Funktion aufgerufen, bekommt sie den Druckzustand -- so kann eine
   * BrutSurface darunter in ihren Schatten rutschen.
   */
  children?: React.ReactNode | ((pressed: boolean) => React.ReactNode);
  disabled?: boolean;
  /**
   * `'scale'` federt die Flaeche auf `scaleTo`. `'push'` laesst sie stattdessen
   * in ihren Schatten rutschen -- die Signaturgeste dieses Stils. Dafuer muss
   * `children` eine Funktion sein, die `pressed` weiterreicht.
   */
  pressStyle?: 'scale' | 'push';
  scaleTo?: number;
  accessibilityLabel?: string;
};

/** Touch-Target mit Haptik sofort beim Druecken und sichtbarem Druckzustand. */
export function HapticButton({
  onPress,
  haptic = 'light',
  style,
  children,
  disabled,
  pressStyle = 'scale',
  scaleTo = 0.96,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

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
        if (pressStyle === 'scale') spring(scaleTo);
        else setPressed(true);
        fire(haptic).catch(() => {});
      }}
      onPressOut={() => {
        if (pressStyle === 'scale') spring(1);
        else setPressed(false);
      }}
      onPress={disabled ? undefined : onPress}
    >
      <Animated.View
        style={[
          {
            transform: pressStyle === 'scale' ? [{ scale }] : undefined,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {typeof children === 'function' ? children(pressed) : children}
      </Animated.View>
    </Pressable>
  );
}

export default HapticButton;
