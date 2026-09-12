import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { BrutSurface } from '@/components/BrutSurface';
import { HapticButton } from '@/components/HapticButton';
import { CATEGORY_KEYS, CATEGORY_META, categoryOf, shapePoints } from '@/lib/categories';
import { PHOTO_QUESTS } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';
import type { CategoryKey } from '@/theme/colors';

type Props = {
  active: Record<CategoryKey, boolean>;
  onToggle: (key: CategoryKey) => void;
  topOffset: number;
};

const CHIP_ICON = 18;
const CHIP_SHAPE_R = 6;
const CHIP_CENTER = CHIP_ICON / 2;

/** Kleine SVG-Form des Chips: gefuellt und in Farbe wenn aktiv, sonst nur Umriss. */
function ChipShape({ categoryKey, active }: { categoryKey: CategoryKey; active: boolean }) {
  const meta = CATEGORY_META[categoryKey];
  const fill = active ? meta.color : 'none';
  const stroke = THEME.border.color;
  const strokeWidth = THEME.border.thin;

  if (meta.shape === 'circle') {
    return (
      <Svg width={CHIP_ICON} height={CHIP_ICON}>
        <Circle
          cx={CHIP_CENTER}
          cy={CHIP_CENTER}
          r={CHIP_SHAPE_R}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  return (
    <Svg width={CHIP_ICON} height={CHIP_ICON}>
      <Polygon
        points={shapePoints(meta.shape, CHIP_CENTER, CHIP_CENTER, CHIP_SHAPE_R)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/**
 * Filterleiste ueber der Karte: fuenf Kategorie-Chips statt der frueheren
 * Ebenenschalter. Eine Kategorie ist keine Datenquelle mehr, sondern eine Art
 * Ort -- dieselben fuenf, die `CATEGORY_META` fuehrt und die auch das
 * Synapsen-Netz benutzt.
 *
 * Aktiv = Flaeche mit Schatten, Form gefuellt. Inaktiv = versenkte Flaeche
 * ohne Schatten, Form nur als Umriss, Beschriftung blass -- der Unterschied
 * muss auch ohne Farbsehen sofort auffallen.
 */
export function MapFilterBar({ active, onToggle, topOffset }: Props) {
  const visibleCount = useMemo(
    () => PHOTO_QUESTS.filter((quest) => active[categoryOf(quest.type)]).length,
    [active],
  );

  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORY_KEYS.map((key) => {
          const meta = CATEGORY_META[key];
          const isActive = active[key];
          return (
            <HapticButton
              key={key}
              haptic="selection"
              pressStyle="push"
              onPress={() => onToggle(key)}
              accessibilityLabel={`${meta.label} ${isActive ? 'ausblenden' : 'einblenden'}`}
            >
              {(pressed) => (
                <BrutSurface
                  tone={isActive ? 'surface' : 'sunken'}
                  pressed={pressed}
                  shadow={isActive ? 'sm' : false}
                  radius={THEME.radius.sm}
                  contentStyle={styles.chip}
                >
                  <ChipShape categoryKey={key} active={isActive} />
                  <Text
                    style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
                  >
                    {meta.label}
                  </Text>
                </BrutSurface>
              )}
            </HapticButton>
          );
        })}
      </ScrollView>
      <BrutSurface
        tone="sunken"
        shadow={false}
        thinBorder
        radius={THEME.radius.sm}
        style={styles.countWrap}
        contentStyle={styles.countRow}
      >
        <Text style={styles.countText}>
          {visibleCount} von {PHOTO_QUESTS.length} Orten sichtbar
        </Text>
      </BrutSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: THEME.spacing.md,
    right: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
    paddingRight: THEME.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 0,
  },
  label: { ...THEME.type.captionStrong, fontSize: 13 },
  labelActive: { color: THEME.colors.text },
  labelInactive: { color: THEME.colors.textFaint },
  countWrap: { alignSelf: 'flex-start', marginTop: THEME.spacing.xs },
  countRow: { paddingHorizontal: THEME.spacing.sm, paddingVertical: 5, minHeight: 0 },
  countText: { ...THEME.type.caption, fontSize: 12, color: THEME.colors.textFaint },
});

export default MapFilterBar;
