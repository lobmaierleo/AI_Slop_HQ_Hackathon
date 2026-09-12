import { View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { THEME } from '@/theme/colors';

/**
 * Jedes Icon der App, mit seiner Entsprechung auf beiden Plattformen.
 *
 * `expo-symbols` zeichnet auf iOS ein SF Symbol und auf Android ein Material
 * Symbol -- aber nur, wenn `name` beide Namen als Objekt bekommt. Ein blosser
 * String faellt auf Android intern auf `null` zurueck und rendert nichts.
 * Deshalb steht hier die Tabelle, und `SymbolName` leitet sich aus ihr ab:
 * ein Icon ohne Android-Entsprechung ist damit ein Typfehler und kein leerer
 * Fleck auf dem Geraet.
 *
 * Die Material-Schrift liegt als Datei im Paket, es wird nichts nachgeladen.
 */
const SYMBOLS = {
  'figure.walk': 'directions_walk',
  'drop.fill': 'water_drop',
  brain: 'psychology',
  'square.grid.2x2': 'grid_view',
  'camera.viewfinder': 'center_focus_weak',
  map: 'map',
  'checkmark.seal.fill': 'verified',
  'xmark.seal.fill': 'cancel',
  'exclamationmark.triangle.fill': 'warning',
  'building.2.fill': 'apartment',
  'leaf.fill': 'eco',
  'bolt.heart.fill': 'bolt',
  wifi: 'wifi',
  magnifyingglass: 'search',
  'location.north.line.fill': 'navigation',
  'arrow.triangle.turn.up.right.diamond.fill': 'directions',
  gear: 'settings',
  'photo.fill': 'image',
  xmark: 'close',
  'chevron.right': 'chevron_right',
  circle: 'circle',
  'trophy.fill': 'trophy',
  'arrow.up.left.and.arrow.down.right': 'zoom_out_map',
  'arrow.counterclockwise': 'replay',
} as const;

export type SymbolName = keyof typeof SYMBOLS;

type Props = {
  name: SymbolName;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
};

/**
 * SF Symbols beziehungsweise Material Symbols statt Emojis. Emojis tragen
 * fremde Farben in ein System mit fester Palette und sehen auf jedem Geraet
 * anders aus.
 *
 * Auf Android wird `weight` ignoriert, dort kommt jedes Icon in Regular.
 */
export function Symbol({ name, size = 17, color = THEME.colors.text, weight = 'semibold' }: Props) {
  return (
    <SymbolView
      name={{ ios: name, android: SYMBOLS[name], web: SYMBOLS[name] }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
      fallback={<View style={{ width: size, height: size }} />}
    />
  );
}
