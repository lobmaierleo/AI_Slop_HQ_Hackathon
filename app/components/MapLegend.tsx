import { StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';
import { HapticButton } from '@/components/HapticButton';
import { Symbol, type SymbolName } from '@/components/Symbol';
import { THEME } from '@/theme/colors';

export type MapLayerKey = 'quests' | 'venues' | 'fountains';

type Props = {
  layers: Record<MapLayerKey, boolean>;
  onToggle: (key: MapLayerKey) => void;
  topOffset: number;
};

const ITEMS: { key: MapLayerKey; icon: SymbolName; label: string }[] = [
  { key: 'quests', icon: 'camera.viewfinder', label: 'Orte' },
  { key: 'venues', icon: 'building.2.fill', label: 'Spielorte' },
  { key: 'fountains', icon: 'drop.fill', label: 'Brunnen' },
];

/** Schwebende Glas-Pillen ueber der Karte: Ebenen unabhaengig ein-/ausblenden. */
export function MapLegend({ layers, onToggle, topOffset }: Props) {
  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="box-none">
      <View style={styles.row}>
        {ITEMS.map((item) => {
          const active = layers[item.key];
          return (
            <HapticButton
              key={item.key}
              haptic="selection"
              scaleTo={0.94}
              onPress={() => onToggle(item.key)}
              accessibilityLabel={`${item.label} ${active ? 'ausblenden' : 'einblenden'}`}
            >
              <GlassSurface
                radius={THEME.radius.pill}
                glow={active}
                contentStyle={styles.pill}
              >
                <Symbol
                  name={item.icon}
                  size={14}
                  color={active ? THEME.colors.primary : THEME.colors.textFaint}
                />
                <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                  {item.label}
                </Text>
              </GlassSurface>
            </HapticButton>
          );
        })}
      </View>
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
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 0,
  },
  label: { ...THEME.type.caption, fontSize: 13, fontWeight: '600' },
  labelActive: { color: THEME.colors.text },
  labelInactive: { color: THEME.colors.textFaint },
});

export default MapLegend;
