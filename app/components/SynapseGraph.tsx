import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { EDGES, NODES } from '@/lib/net';
import { THEME } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Rand in Pixeln, damit die Halos der Aussenknoten nicht abgeschnitten werden. */
const PAD = 26;
const NODE_R = 7;
const HALO_R = 17;

type Props = {
  size: number;
  completedIds: readonly string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Das persoenliche Netz als Graph.
 *
 * Die Positionen sind in scripts/build_graph.py aus den echten Linzer
 * Koordinaten vorberechnet: Wer den Hauptplatz auf der Karte gesehen hat,
 * findet ihn hier an derselben Stelle wieder. Der Graph ist damit keine
 * Dekoration, sondern eine zweite Ansicht derselben Stadt.
 */
export function SynapseGraph({ size, completedIds, selectedId, onSelect }: Props) {
  const found = useMemo(() => new Set(completedIds), [completedIds]);
  const inner = size - PAD * 2;
  const px = (n: { x: number; y: number }) => ({
    cx: PAD + n.x * inner,
    cy: PAD + n.y * inner,
  });

  const byId = useMemo(() => new Map(NODES.map((n) => [n.id, n])), []);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {EDGES.map((edge) => {
          const a = byId.get(edge.a);
          const b = byId.get(edge.b);
          if (!a || !b) return null;
          const pa = px(a);
          const pb = px(b);
          return (
            <Synapse
              key={`${edge.a}-${edge.b}`}
              x1={pa.cx}
              y1={pa.cy}
              x2={pb.cx}
              y2={pb.cy}
              active={found.has(edge.a) && found.has(edge.b)}
              dashed={edge.kind === 'space'}
            />
          );
        })}
        {NODES.map((node, i) => {
          const { cx, cy } = px(node);
          return (
            <Neuron
              key={node.id}
              cx={cx}
              cy={cy}
              active={found.has(node.id)}
              selected={node.id === selectedId}
              index={i}
            />
          );
        })}
      </Svg>

      {/* Trefferflaechen liegen ueber dem SVG: 44px nach Apples Mindestmass,
          waehrend die Knoten optisch nur 14px gross sind. */}
      {NODES.map((node) => {
        const { cx, cy } = px(node);
        return (
          <Pressable
            key={node.id}
            onPress={() => onSelect(node.id)}
            style={[styles.hit, { left: cx - 22, top: cy - 22 }]}
            accessibilityRole="button"
          />
        );
      })}
    </View>
  );
}

/**
 * Eine Verbindung. Sie leuchtet erst, wenn beide Enden entdeckt sind, und
 * zeichnet sich dann einmal von a nach b durch -- der sichtbare Moment, in dem
 * zwei Datenwelten sich beruehren.
 */
function Synapse({
  x1,
  y1,
  x2,
  y2,
  active,
  dashed,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  dashed: boolean;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const draw = useSharedValue(active ? 0 : length);

  useEffect(() => {
    draw.value = withTiming(active ? 0 : length, {
      duration: active ? 650 : 0,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, length, draw]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));

  if (!active) {
    return (
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.track}
        strokeWidth={dashed ? 0.75 : 1}
        strokeDasharray={dashed ? '2 5' : undefined}
      />
    );
  }

  return (
    <>
      {/* Zwei Linien uebereinander: die breite, transparente ist der Schein,
          die schmale darueber die eigentliche Synapse. */}
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.primaryGlow}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={length}
        animatedProps={props}
        opacity={0.35}
      />
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={length}
        animatedProps={props}
      />
    </>
  );
}

/** Ein Ort. Entdeckt atmet er, unentdeckt bleibt er ein leerer Ring. */
function Neuron({
  cx,
  cy,
  active,
  selected,
  index,
}: {
  cx: number;
  cy: number;
  active: boolean;
  selected: boolean;
  index: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = 0;
      return;
    }
    // Phasenversatz je Knoten: sonst blinkt das ganze Netz im Gleichtakt und
    // wirkt wie eine Lichterkette statt wie etwas Lebendiges.
    pulse.value = withDelay(
      index * 170,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [active, index, pulse]);

  const halo = useAnimatedProps(() => ({
    r: HALO_R * (0.72 + pulse.value * 0.28),
    opacity: 0.28 - pulse.value * 0.16,
  }));

  if (!active) {
    return (
      <Circle
        cx={cx}
        cy={cy}
        r={NODE_R - 1.5}
        fill="transparent"
        stroke={THEME.colors.text}
        strokeWidth={1}
        opacity={0.3}
      />
    );
  }

  return (
    <>
      <AnimatedCircle cx={cx} cy={cy} fill={THEME.colors.primary} animatedProps={halo} />
      <Circle cx={cx} cy={cy} r={NODE_R} fill={THEME.colors.primary} />
      {selected && (
        <Circle
          cx={cx}
          cy={cy}
          r={NODE_R + 5}
          fill="none"
          stroke={THEME.colors.text}
          strokeWidth={1.5}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', width: 44, height: 44 },
});
