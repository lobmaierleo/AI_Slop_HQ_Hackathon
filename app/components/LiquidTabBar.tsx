import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/GlassSurface';
import { Symbol, type SymbolName } from '@/components/Symbol';
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

const TAB_ICONS: Record<string, SymbolName> = {
  index: 'square.grid.2x2',
  quests: 'camera.viewfinder',
  map: 'map',
  network: 'brain',
};

const PILL_INSET = 8;

export function LiquidTabBar({ state, descriptors, navigation }: LiquidTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;

  const activeIndex = state.index;
  const tabCount = state.routes.length;

  useEffect(() => {
    if (barWidth <= 0) return;
    const tabWidth = barWidth / tabCount;
    Animated.spring(pillX, {
      toValue: activeIndex * tabWidth + PILL_INSET,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [activeIndex, barWidth, tabCount, pillX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  const pillWidth = barWidth > 0 ? barWidth / tabCount - PILL_INSET * 2 : 0;

  return (
    <View
      style={[styles.shadowWrapper, { bottom: Math.max(24, insets.bottom) }]}
      onLayout={handleLayout}
    >
      <GlassSurface
        radius={32}
        intensity={70}
        style={styles.glassContainer}
        contentStyle={styles.glassContent}
      >
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
            const icon = TAB_ICONS[route.name] ?? 'circle';
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
                <View style={{ opacity: focused ? 1 : 0.6 }}>
                  <Symbol
                    name={icon}
                    size={20}
                    color={focused ? THEME.colors.primary : THEME.colors.textMuted}
                  />
                </View>
                <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
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
  glassContainer: { flex: 1 },
  // Die Leiste traegt ihr eigenes Layout; die Standard-Polsterung der
  // Glasflaeche wuerde die vier Felder ungleich stauchen.
  glassContent: { flex: 1, padding: 0 },
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.primarySoft,
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
  label: {
    marginTop: 3,
    ...THEME.type.eyebrow,
    fontSize: 11,
    letterSpacing: 0,
  },
  labelActive: {
    color: THEME.colors.primary,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
  },
});

export default LiquidTabBar;
