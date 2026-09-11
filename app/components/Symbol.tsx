import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { THEME } from '@/theme/colors';

type Props = {
  name: SymbolViewProps['name'];
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
};

/**
 * SF Symbols statt Emojis. Emojis tragen fremde Farben in ein System, das
 * genau einen Akzent kennt, und sehen auf jedem Geraet anders aus.
 *
 * Die App laeuft nur auf iOS, deshalb braucht es keinen Fallback.
 */
export function Symbol({ name, size = 17, color = THEME.colors.text, weight = 'semibold' }: Props) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}

export type SymbolName = SymbolViewProps['name'];
