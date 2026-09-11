import { StyleSheet, Text, View } from 'react-native';

import { BrutSurface } from '@/components/BrutSurface';
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

/**
 * Schaltknoepfe ueber der Karte: Ebenen unabhaengig ein- und ausblenden.
 * Aktiv heisst gelb gefuellt, inaktiv weiss -- auf der hellen Karte reicht der
 * Rahmen allein nicht als Unterschied.
 */
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
              pressStyle="push"
              onPress={() => onToggle(item.key)}
              accessibilityLabel={`${item.label} ${active ? 'ausblenden' : 'einblenden'}`}
            >
              {(pressed) => (
                <BrutSurface
                  tone={active ? 'primary' : 'surface'}
                  pressed={pressed}
                  shadow="sm"
                  radius={THEME.radius.sm}
                  contentStyle={styles.pill}
                >
                  <Symbol
                    name={item.icon}
                    size={14}
                    color={active ? THEME.colors.ink : THEME.colors.textFaint}
                  />
                  <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                    {item.label}
                  </Text>
                </BrutSurface>
              )}
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
    height: 36,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 0,
  },
  label: { ...THEME.type.captionStrong, fontSize: 13 },
  labelActive: { color: THEME.colors.onSignal },
  labelInactive: { color: THEME.colors.textMuted },
});

export default MapLegend;
