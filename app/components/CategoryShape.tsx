import Svg, { Circle, Polygon } from 'react-native-svg';

import { shapePoints, type NodeShape } from '@/lib/categories';
import { THEME } from '@/theme/colors';

type Props = {
  shape: NodeShape;
  /** Kantenlaenge des Quadrats, in dem die Form zentriert sitzt. */
  size: number;
  /** Radius der Form. */
  r: number;
  fill: string;
  strokeWidth?: number;
};

/**
 * Die Kategorieform als kleines SVG -- Kreis, Quadrat, Dreieck, Raute oder
 * Sechseck aus `lib/categories`. Karte, Filterleiste und Netz zeichnen
 * dieselben Formen; hier steht sie einmal fuer alle Stellen, die nur ein
 * Zeichen neben einem Text brauchen.
 */
export function CategoryShape({ shape, size, r, fill, strokeWidth = THEME.border.thin }: Props) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      {shape === 'circle' ? (
        <Circle cx={c} cy={c} r={r} fill={fill} stroke={THEME.border.color} strokeWidth={strokeWidth} />
      ) : (
        <Polygon
          points={shapePoints(shape, c, c, r)}
          fill={fill}
          stroke={THEME.border.color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export default CategoryShape;
