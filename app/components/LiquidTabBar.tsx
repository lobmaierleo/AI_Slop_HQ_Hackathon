import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/theme/colors';

/**
 * Schlanke, lokale Nachbildung der relevanten Teile von `BottomTabBarProps`
 * (`@react-navigation/bottom-tabs`). Das Paket ist in diesem Projekt nur
 * transitiv über `expo-router` vorhanden und wird von diesem nicht als
 * eigenständiger Typ re-exportiert — daher der eigene, minimale Vertrag.
 */
type LiquidTabRoute = { key: string; name: string };

type LiquidTabState = {
  index: number;
  routes: LiquidTabRoute[];
};

type LiquidTabDescriptor = {
  options: { title?: string };
};

type LiquidTabEmitResult = { defaultPrevented: boolean };

type LiquidTabNavigation = {
  emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => LiquidTabEmitResult;
  navigate: (name: string) => void;
};

export type LiquidTabBarProps = {
  state: LiquidTabState;
  descriptors: Record<string, LiquidTabDescriptor>;
  navigation: LiquidTabNavigation;
};

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  quests: '🎯',
};

const PILL_INSET = 8;

export function LiquidTabBar({ state, descriptors, navigation }: LiquidTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;

  const activeIndex = state.index;

  useEffect(() => {
    if (barWidth <= 0) return;
    const halfWidth = barWidth / 2;
    Animated.spring(pillX, {
      toValue: activeIndex * halfWidth + PILL_INSET,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [activeIndex, barWidth, pillX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  const pillWidth = barWidth > 0 ? barWidth / 2 - PILL_INSET * 2 : 0;

  return (
    <View
      style={[styles.shadowWrapper, { bottom: Math.max(24, insets.bottom) }]}
      onLayout={handleLayout}
    >
      <View style={styles.glassContainer}>
        <BlurView intensity={80} tint="systemMaterialLight" style={StyleSheet.absoluteFill} />
        <View style={styles.webFallback} pointerEvents="none" />

        {barWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                width: pillWidth,
                transform: [{ translateX: pillX }],
              },
            ]}
          />
        )}

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const icon = TAB_ICONS[route.name] ?? '•';
            const focused = activeIndex === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                style={styles.item}
              >
                <Text
                  style={[
                    styles.icon,
                    { opacity: focused ? 1 : 0.55 },
                    focused && styles.iconActive,
                  ]}
                >
                  {icon}
                </Text>
                <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: 24,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glassContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
  },
  webFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.colors.glassBackground,
  },
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    borderRadius: THEME.radius.pill,
    backgroundColor: 'rgba(255, 92, 0, 0.12)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  iconActive: {
    color: THEME.colors.primary,
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: THEME.colors.primary,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
  },
});

export default LiquidTabBar;
