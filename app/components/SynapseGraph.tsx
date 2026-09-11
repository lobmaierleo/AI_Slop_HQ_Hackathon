import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { CATEGORY_KEYS, CATEGORY_META, categoryOf, shapePoints, shortLabel } from '@/lib/categories';
import { EDGES, NODES, activeEdges } from '@/lib/net';
import { PHOTO_QUESTS } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Rand in Pixeln, damit Beschriftungen der Aussenknoten Platz haben. */
const PAD = 30;
const NODE_R = 11;
const NODE_R_DIM = 7;

const LABEL_FONT = 9;
const LABEL_HEIGHT = 15;

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
  const labels = useMemo(
    () => new Map(PHOTO_QUESTS.map((q) => [q.id, shortLabel(q.title)])),
    [],
  );
  const activeCount = useMemo(() => activeEdges(completedIds).length, [completedIds]);

  return (
    <View style={{ width: size }}>
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
                bridge={edge.kind === 'space'}
              />
            );
          })}
          {NODES.map((node) => {
            const { cx, cy } = px(node);
            return (
              <Neuron
                key={node.id}
                cx={cx}
                cy={cy}
                type={node.type}
                label={labels.get(node.id) ?? ''}
                active={found.has(node.id)}
                selected={node.id === selectedId}
                bounds={size}
              />
            );
          })}
        </Svg>

        {/* Die eine Zahl, die beim Herumreichen sofort erklaert, worum es geht. */}
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>
            {found.size}/{NODES.length} Orte · {activeCount}/{EDGES.length} Synapsen
          </Text>
        </View>

        {/* Trefferflaechen liegen ueber dem SVG: 44px nach Apples Mindestmass,
            waehrend die Knoten optisch nur gut 20px gross sind. */}
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

      <GraphLegend />
    </View>
  );
}

/**
 * Eine Verbindung. Sie erscheint erst, wenn beide Enden entdeckt sind, und
 * zeichnet sich dann einmal von a nach b durch -- der sichtbare Moment, in dem
 * zwei Datenwelten sich beruehren.
 *
 * `bridge` sind die Kanten zwischen zwei Datenwelten. Sie sind das
 * Wettbewerbsargument und deshalb die dicksten Linien im Bild, nicht die
 * duennsten.
 */
function Synapse({
  x1,
  y1,
  x2,
  y2,
  active,
  bridge,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  bridge: boolean;
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
        stroke={THEME.colors.textFaint}
        strokeWidth={1}
        strokeDasharray="2 5"
        opacity={0.4}
      />
    );
  }

  if (!bridge) {
    return (
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={length}
        animatedProps={props}
      />
    );
  }

  return (
    <>
      {/* Schwarze Fassung unten, Farbe darueber -- die Aufkleber-Kontur des
          Stils, und auf hellem Grund besser lesbar als ein Schein. */}
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.ink}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={length}
        animatedProps={props}
      />
      <AnimatedLine
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={THEME.colors.primary}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={length}
        animatedProps={props}
      />
    </>
  );
}

/**
 * Ein Ort. Unentdeckt ein kleiner weisser Umriss, entdeckt die Form seiner
 * Kategorie in ihrer Farbe, mit schwarzer Kontur und Namensschild.
 */
function Neuron({
  cx,
  cy,
  type,
  label,
  active,
  selected,
  bounds,
}: {
  cx: number;
  cy: number;
  type: string;
  label: string;
  active: boolean;
  selected: boolean;
  bounds: number;
}) {
  const meta = CATEGORY_META[categoryOf(type)];
  const r = active ? NODE_R : NODE_R_DIM;

  // Einmaliges Aufploppen statt Dauerpuls: der Ring faehrt genau dann heraus,
  // wenn ein Knoten neu entdeckt wird, und hoert danach auf.
  const pop = useSharedValue(0);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      pop.value = 0;
      pop.value = withSequence(
        withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      );
    }
    wasActive.current = active;
  }, [active, pop]);

  const stamp = useAnimatedProps(() => ({
    r: NODE_R + pop.value * NODE_R * 1.4,
    opacity: pop.value > 0 ? 1 - pop.value : 0,
  }));

  if (!active) {
    return (
      <Shape
        shape={meta.shape}
        cx={cx}
        cy={cy}
        r={r}
        fill={THEME.colors.surface}
        stroke={THEME.colors.ink}
        strokeWidth={2}
        dashed
        opacity={0.5}
      />
    );
  }

  const width = Math.max(label.length * LABEL_FONT * 0.62 + 10, 26);
  const center = Math.min(Math.max(cx, width / 2 + 2), bounds - width / 2 - 2);
  const top = cy + r + 5;

  return (
    <G>
      <AnimatedCircle
        cx={cx}
        cy={cy}
        fill="none"
        stroke={THEME.colors.ink}
        strokeWidth={2}
        animatedProps={stamp}
      />
      {selected && (
        <Circle
          cx={cx}
          cy={cy}
          r={r + 7}
          fill="none"
          stroke={THEME.colors.ink}
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
      <Shape
        shape={meta.shape}
        cx={cx}
        cy={cy}
        r={r}
        fill={meta.color}
        stroke={THEME.colors.ink}
        strokeWidth={3}
      />
      {label ? (
        <>
          <Rect
            x={center - width / 2}
            y={top}
            width={width}
            height={LABEL_HEIGHT}
            rx={2}
            fill={THEME.colors.surface}
            stroke={THEME.colors.ink}
            strokeWidth={1.5}
          />
          <SvgText
            x={center}
            y={top + LABEL_HEIGHT - 4.5}
            fontSize={LABEL_FONT}
            fontWeight="700"
            fill={THEME.colors.ink}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        </>
      ) : null}
    </G>
  );
}

/** Kreis oder Vieleck -- je nach Kategorie. */
function Shape({
  shape,
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
  dashed,
  opacity,
}: {
  shape: (typeof CATEGORY_META)[keyof typeof CATEGORY_META]['shape'];
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dashed?: boolean;
  opacity?: number;
}) {
  const common = {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray: dashed ? '3 3' : undefined,
    opacity,
  };
  if (shape === 'circle') {
    return <Circle cx={cx} cy={cy} r={r} {...common} />;
  }
  return <Polygon points={shapePoints(shape, cx, cy, r)} strokeLinejoin="round" {...common} />;
}

/**
 * Ohne Legende bleiben fuenf Formen ein Raetsel -- und beim Voting gibt es
 * keine Zeit zum Raetseln.
 */
function GraphLegend() {
  return (
    <View style={styles.legend}>
      {CATEGORY_KEYS.map((key) => {
        const meta = CATEGORY_META[key];
        return (
          <View key={key} style={styles.chip}>
            <Svg width={16} height={16}>
              <Shape
                shape={meta.shape}
                cx={8}
                cy={8}
                r={6}
                fill={meta.color}
                stroke={THEME.colors.ink}
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.chipText}>{meta.label}</Text>
          </View>
        );
      })}

      <View style={styles.chip}>
        <Svg width={16} height={16}>
          <Line x1={0} y1={8} x2={16} y2={8} stroke={THEME.colors.ink} strokeWidth={2} />
        </Svg>
        <Text style={styles.chipText}>Verwandte Orte</Text>
      </View>
      <View style={styles.chip}>
        <Svg width={16} height={16}>
          <Line x1={0} y1={8} x2={16} y2={8} stroke={THEME.colors.ink} strokeWidth={6} />
          <Line x1={0} y1={8} x2={16} y2={8} stroke={THEME.colors.primary} strokeWidth={2.5} />
        </Svg>
        <Text style={styles.chipText}>Datenbrücke</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', width: 44, height: 44 },
  counter: {
    position: 'absolute',
    left: 0,
    top: 0,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
  },
  counterText: {
    ...THEME.type.eyebrow,
    fontSize: 11,
    color: THEME.colors.onSignal,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
  },
  chipText: {
    ...THEME.type.caption,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
});

export default SynapseGraph;
