import { useEffect, useMemo } from 'react';
import type { ComponentType, RefObject } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';

import { BrutSurface } from '@/components/BrutSurface';
import {
  CATEGORY_KEYS,
  CATEGORY_META,
  categoryOf,
  shapePoints,
  type NodeShape,
} from '@/lib/categories';
import { EDGES, NODES, activeEdges } from '@/lib/net';
import { PHOTO_QUESTS } from '@/state/useGameStore';
import { THEME, type CategoryKey } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Rand in Pixeln, damit Formen und Schatten der Aussenknoten nicht abgeschnitten werden. */
const PAD = 30;
const NODE_R = 11;

/** Trefferradius fuer die Tipp-Auswahl -- groesser als die sichtbare Form. */
const HIT_R = 22;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

type Props = {
  size: number;
  completedIds: readonly string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Damit die Pinch-Geste das Scrollen der umgebenden Seite blockiert. */
  scrollRef: RefObject<ScrollView | null>;
};

/**
 * Das persoenliche Netz als Graph.
 *
 * Die Positionen sind in scripts/build_graph.py aus den echten Linzer
 * Koordinaten vorberechnet: Wer den Hauptplatz auf der Karte gesehen hat,
 * findet ihn hier an derselben Stelle wieder. Der Graph ist damit keine
 * Dekoration, sondern eine zweite Ansicht derselben Stadt.
 *
 * Anders als frueher ist hier nichts vorgezeichnet: Nur entdeckte Orte
 * bekommen ueberhaupt eine Form, nur Kanten zwischen zwei entdeckten Orten
 * eine Linie. Das fertige Netz zu zeigen wuerde verraten, wie viel fehlt und
 * wo -- genau das soll die Entdeckung tragen, nicht ein Blick auf die Karte.
 */
export function SynapseGraph({ size, completedIds, selectedId, onSelect, scrollRef }: Props) {
  const found = useMemo(() => new Set(completedIds), [completedIds]);
  const inner = size - PAD * 2;
  const px = (n: { x: number; y: number }) => ({ cx: PAD + n.x * inner, cy: PAD + n.y * inner });

  const discovered = useMemo(() => NODES.filter((n) => found.has(n.id)), [found]);
  const edges = useMemo(() => activeEdges(completedIds), [completedIds]);
  const legendKeys = useMemo(
    () =>
      CATEGORY_KEYS.filter((key) => discovered.some((n) => categoryOf(n.type) === key)),
    [discovered],
  );

  // -- Zoom & Verschieben ---------------------------------------------------
  // Ein Skalarwert plus sein "gesicherter" Zwilling: Gesten schreiben relativ
  // zum zuletzt gesicherten Stand, der Zwilling wird erst beim Loslassen
  // uebernommen. So haengen aufeinanderfolgende Pinch-Gesten nicht am
  // Zwischenstand einer vorherigen.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      // Etwas Unterschwung unter 1 ist erlaubt -- fuehlt sich elastisch an --,
      // federt aber beim Loslassen zurueck (siehe onEnd).
      scale.value = clamp(savedScale.value * e.scale, 0.7, MAX_SCALE);
    })
    .onEnd(() => {
      const next = scale.value < MIN_SCALE ? MIN_SCALE : scale.value;
      scale.value = withSpring(next);
      savedScale.value = next;
      if (next === MIN_SCALE) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    })
    // Blockt den Scroll der Seite, solange am Netz gezoomt wird. Der Typ von
    // blocksExternalGesture verlangt einen Ref auf den Komponenten-Typ statt
    // die Instanz -- ein bekannter Typ-Ausrutscher der Bibliothek, zur Laufzeit
    // reicht der Ref auf die ScrollView selbst.
    .blocksExternalGesture(scrollRef as unknown as RefObject<ComponentType | null>);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Verschieben ergibt erst etwas her, wenn ueberhaupt vergroessert ist.
      if (scale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      scale.value = withSpring(MIN_SCALE);
      savedScale.value = MIN_SCALE;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Ein einfacher Tipp waehlt einen Knoten -- muss also warten, bis feststeht,
  // dass kein zweiter Tipp mehr kommt. `requireExternalGestureToFail` staffelt
  // die beiden, sonst schluckt der Doppeltipp jede einzelne Auswahl.
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .requireExternalGestureToFail(doubleTap)
    .runOnJS(true)
    .onEnd((e) => {
      let hitId: string | null = null;
      let hitDist = HIT_R;
      for (const node of discovered) {
        const { cx, cy } = px(node);
        const d = Math.hypot(cx - e.x, cy - e.y);
        if (d <= hitDist) {
          hitDist = d;
          hitId = node.id;
        }
      }
      if (hitId) onSelect(hitId);
    });

  const composed = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (discovered.length === 0) {
    return (
      <View style={{ width: size }}>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={{ width: size }}>
      <View style={[styles.frame, { width: size, height: size }]}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
            <Svg width={size} height={size}>
              {edges.map((edge) => {
                const a = NODES.find((n) => n.id === edge.a);
                const b = NODES.find((n) => n.id === edge.b);
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
                    bridge={edge.kind === 'space'}
                  />
                );
              })}
              {discovered.map((node) => {
                const { cx, cy } = px(node);
                return (
                  <Neuron
                    key={node.id}
                    cx={cx}
                    cy={cy}
                    type={node.type}
                    selected={node.id === selectedId}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        </GestureDetector>

        {/* Die eine Zahl, die beim Herumreichen sofort erklaert, worum es geht. */}
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>
            {discovered.length}/{NODES.length} Orte · {edges.length}/{EDGES.length} Synapsen
          </Text>
        </View>
      </View>

      {discovered.length === 1 ? (
        <Text style={styles.gestureHint}>Noch keine Synapse -- die erste entsteht mit dem zweiten Ort.</Text>
      ) : (
        <Text style={styles.gestureHint}>Zwei Finger zum Zoomen, Doppeltipp setzt zurück.</Text>
      )}

      {legendKeys.length > 0 ? <GraphLegend keys={legendKeys} /> : null}
    </View>
  );
}

/** Kein leeres Quadrat, solange noch niemand einen Ort gefunden hat. */
function EmptyState() {
  return (
    <BrutSurface radius={THEME.radius.md} contentStyle={styles.emptyContent}>
      <Text style={styles.emptyTitle}>Dein Netz ist leer.</Text>
      <Text style={styles.emptyBody}>
        Der erste Ort, an dem du warst, wird der erste Knoten.
      </Text>
      <Text style={styles.emptyCount}>{PHOTO_QUESTS.length} Orte warten darauf, gefunden zu werden.</Text>
    </BrutSurface>
  );
}

/**
 * Eine Synapse. Sie existiert nur, weil beide Enden entdeckt sind, und
 * zeichnet sich beim Erscheinen einmal von a nach b durch -- der sichtbare
 * Moment, in dem zwei Datenwelten sich beruehren.
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
  bridge,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bridge: boolean;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const draw = useSharedValue(length);

  useEffect(() => {
    draw.value = withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) });
    // Einmalig beim Erscheinen dieser Synapse -- sie wird nur gemountet, wenn
    // sie gerade neu aktiv geworden ist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));

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
        animatedProps={animatedProps}
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
        animatedProps={animatedProps}
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
        animatedProps={animatedProps}
      />
    </>
  );
}

/**
 * Ein entdeckter Ort: die Form seiner Kategorie in ihrer Farbe, mit schwarzer
 * Kontur. Unentdeckte Orte werden gar nicht erst gerendert.
 */
function Neuron({
  cx,
  cy,
  type,
  selected,
}: {
  cx: number;
  cy: number;
  type: string;
  selected: boolean;
}) {
  const meta = CATEGORY_META[categoryOf(type)];
  const pop = useSharedValue(0);

  useEffect(() => {
    // Der Pop-Stempel beim Freischalten -- die einzige Bewegung eines
    // Knotens, deshalb einmalig beim Erscheinen.
    pop.value = withSequence(
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stamp = useAnimatedProps(() => ({
    r: NODE_R + pop.value * NODE_R * 1.4,
    opacity: pop.value > 0 ? 1 - pop.value : 0,
  }));

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
          r={NODE_R + 7}
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
        r={NODE_R}
        fill={meta.color}
        stroke={THEME.colors.ink}
        strokeWidth={3}
      />
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
}: {
  shape: NodeShape;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  if (shape === 'circle') {
    return <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }
  return (
    <Polygon
      points={shapePoints(shape, cx, cy, r)}
      strokeLinejoin="round"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

/**
 * Ohne Legende bleiben Formen ein Raetsel -- aber nur fuer Kategorien zu
 * werben, von denen noch kein Knoten entdeckt ist, wuerde wieder verraten,
 * was kommt. Deshalb nur die Kategorien, die schon mindestens einmal
 * aufgetaucht sind.
 */
function GraphLegend({ keys }: { keys: CategoryKey[] }) {
  return (
    <View style={styles.legend}>
      {keys.map((key) => {
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
  // overflow: 'hidden' -- der vergroesserte, verschobene Graph darf nicht
  // ueber seinen eigenen Rahmen hinaus zeichnen.
  frame: { overflow: 'hidden' },
  counter: {
    position: 'absolute',
    left: 0,
    top: 0,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 5,
    borderBottomRightRadius: THEME.radius.sm,
    borderRightWidth: THEME.border.thin,
    borderBottomWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.primary,
  },
  counterText: {
    ...THEME.type.eyebrow,
    fontSize: 11,
    color: THEME.colors.onSignal,
  },
  gestureHint: {
    ...THEME.type.caption,
    fontSize: 12,
    color: THEME.colors.textFaint,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingVertical: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyTitle: { ...THEME.type.heading, color: THEME.colors.text, textAlign: 'center' },
  emptyBody: { ...THEME.type.body, color: THEME.colors.textMuted, textAlign: 'center' },
  emptyCount: {
    ...THEME.type.captionStrong,
    color: THEME.colors.textFaint,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
