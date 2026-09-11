import { StyleSheet, Text, View } from 'react-native';

import { HapticButton } from '@/components/HapticButton';
import { THEME } from '@/theme/colors';

export type MapLayerKey = 'quests' | 'venues' | 'fountains';

type Props = {
  layers: Record<MapLayerKey, boolean>;
  onToggle: (key: MapLayerKey) => void;
  topOffset: number;
};

const ITEMS: { key: MapLayerKey; icon: string; label: string }[] = [
  { key: 'quests', icon: '🎯', label: 'Quests' },
  { key: 'venues', icon: '📍', label: 'Spielorte' },
  { key: 'fountains', icon: '🚰', label: 'Brunnen' },
];

/** Schwebende Pillen-Toggles über der Karte: Ebenen unabhängig ein-/ausblenden. */
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
              style={[styles.pill, active ? styles.pillActive : null]}
              onPress={() => onToggle(item.key)}
              accessibilityLabel={`${item.label} ${active ? 'ausblenden' : 'einblenden'}`}
            >
              <Text style={[styles.icon, active ? null : styles.iconInactive]}>{item.icon}</Text>
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {item.label}
              </Text>
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
    height: 44,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pillActive: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primary,
  },
  icon: {
    fontSize: 15,
  },
  iconInactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: THEME.colors.primary,
  },
  labelInactive: {
    color: THEME.colors.textMuted,
  },
});

export default MapLegend;
