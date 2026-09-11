import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrutSurface } from '@/components/BrutSurface';
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

const BAR_HEIGHT = 62;
const PILL_INSET = 5;

/**
 * Die Tab-Leiste: ein weisser Block mit Rahmen und hartem Schatten, der aktive
 * Tab ein gelber Klotz. Die Feder, die den Klotz schiebt, ist geblieben --
 * ohne sie wirkt der Wechsel abgehackt.
 */
export function LiquidTabBar({ state, descriptors, navigation }: LiquidTabBarProps) {
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;

  const activeIndex = state.index;
  const tabCount = state.routes.length;

  useEffect(() => {
    if (rowWidth <= 0) return;
    const tabWidth = rowWidth / tabCount;
    Animated.spring(pillX, {
      toValue: activeIndex * tabWidth + PILL_INSET,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [activeIndex, rowWidth, tabCount, pillX]);

  // Gemessen wird die Reihe selbst, nicht der Rahmen -- der haelt rechts und
  // unten Platz fuer den Schatten frei und waere als Bezug zu breit.
  const handleLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  const pillWidth = rowWidth > 0 ? rowWidth / tabCount - PILL_INSET * 2 : 0;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(20, insets.bottom) }]}>
      <BrutSurface radius={THEME.radius.md} style={styles.bar} contentStyle={styles.barContent}>
        <View style={styles.row} onLayout={handleLayout}>
          {rowWidth > 0 && (
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
                <Symbol
                  name={icon}
                  size={20}
                  color={focused ? THEME.colors.ink : THEME.colors.textFaint}
                />
                <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BrutSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: THEME.spacing.lg,
    height: BAR_HEIGHT + THEME.shadow.offset,
  },
  bar: { flex: 1 },
  // Die Leiste traegt ihr eigenes Layout; die Standard-Polsterung der Flaeche
  // wuerde die vier Felder ungleich stauchen.
  barContent: { padding: 0 },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: 0,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
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
    letterSpacing: 0.2,
  },
  labelActive: {
    color: THEME.colors.onSignal,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
  },
});

export default LiquidTabBar;
