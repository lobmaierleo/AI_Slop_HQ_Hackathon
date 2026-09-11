import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import { HapticButton } from "@/components/HapticButton";
import { TEAMS, useGameStore } from "@/state/useGameStore";
import { TEAM_LOGOS } from "@/theme/logos";
import { THEME } from "@/theme/colors";

const CARD_GAP = THEME.spacing.md;
const CARD_MAX_WIDTH = 320;
const CARD_MAX_HEIGHT = 470;
/** Freiraum links und rechts, damit die Nachbarkarten sichtbar hervorlugen. */
const RAIL_PEEK = 96;
const SIDE_CARD_SCALE = 0.86;
const SIDE_CARD_OPACITY = 0.4;
const SIDE_CARD_DROP = 22;

/**
 * Farbwechsel ohne JS-Thread: vier deckungsgleiche Flaechen, deren Deckkraft
 * am Scroll-Offset haengt. Eine animierte `backgroundColor` waere nicht
 * native-driver-faehig und wuerde beim Wischen ruckeln.
 */
type CrossfadeProps = {
  colors: readonly string[];
  scrollX: Animated.Value;
  snap: number;
  /** Ersetzt das randlose Fuellen — muss dann selbst positionieren. */
  style?: StyleProp<ViewStyle>;
};

function Crossfade({ colors, scrollX, snap, style }: CrossfadeProps) {
  return (
    <>
      {colors.map((color, index) => (
        <Animated.View
          key={color}
          pointerEvents="none"
          style={[
            style ?? StyleSheet.absoluteFill,
            {
              backgroundColor: color,
              opacity: scrollX.interpolate({
                inputRange: [
                  (index - 1) * snap,
                  index * snap,
                  (index + 1) * snap,
                ],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      ))}
    </>
  );
}

export default function Index() {
  const { selectTeam } = useGameStore();
  const { width, height } = useWindowDimensions();

  const cardWidth = Math.min(width - RAIL_PEEK, CARD_MAX_WIDTH);
  const cardHeight = Math.min(height * 0.56, CARD_MAX_HEIGHT);
  const snap = cardWidth + CARD_GAP;
  const sidePadding = (width - cardWidth) / 2;
  const logoSize = cardHeight * 0.4;
  // Der Farbkreis liegt absolut hinter dem Logo und belegt bewusst keine
  // Layouthoehe — sonst kippt die Karte auf 4-Zoll-Geraeten ueber den Rand.
  const haloSize = logoSize * 1.5;

  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const tints = useMemo(() => TEAMS.map((entry) => entry.tint), []);
  const colors = useMemo(() => TEAMS.map((entry) => entry.color), []);
  // Die animierte Deckkraft gehoert dem Uebergang, die Grundtransparenz des
  // Farbschleiers steckt deshalb im Alphakanal der Farbe selbst.
  const glowColors = useMemo(
    () => TEAMS.map((entry) => `${entry.color}1F`),
    [],
  );

  const active = TEAMS[activeIndex] ?? TEAMS[0];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const next = Math.round(event.nativeEvent.contentOffset.x / snap);
        const clamped = Math.max(0, Math.min(TEAMS.length - 1, next));
        if (clamped === activeIndex) return;
        setActiveIndex(clamped);
        Haptics.selectionAsync().catch(() => {});
      },
    },
  );

  const scrollToIndex = (index: number) => {
    scroller.current?.scrollTo({ x: index * snap, animated: true });
  };

  return (
    <View style={styles.root}>
      <Crossfade colors={tints} scrollX={scrollX} snap={snap} />
      <Crossfade
        colors={glowColors}
        scrollX={scrollX}
        snap={snap}
        style={[
          styles.glow,
          {
            width: width * 1.8,
            height: width * 1.8,
            borderRadius: width * 0.9,
            left: -width * 0.4,
            top: height * 0.08,
          },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI SLOPPY · ARS ELECTRONICA 2026</Text>
          <Text style={styles.title}>Wähle dein Lab.</Text>
        </View>

        <View style={styles.stage}>
          <Animated.ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={snap}
            snapToAlignment="start"
            disableIntervalMomentum
            scrollEventThrottle={16}
            onScroll={handleScroll}
            style={styles.rail}
            contentContainerStyle={{ paddingHorizontal: sidePadding }}
          >
            {TEAMS.map((entry, index) => {
              const inputRange = [
                (index - 1) * snap,
                index * snap,
                (index + 1) * snap,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
                extrapolate: "clamp",
              });
              const translateY = scrollX.interpolate({
                inputRange,
                outputRange: [SIDE_CARD_DROP, 0, SIDE_CARD_DROP],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [SIDE_CARD_OPACITY, 1, SIDE_CARD_OPACITY],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={entry.id}
                  style={{
                    width: cardWidth,
                    marginRight: index === TEAMS.length - 1 ? 0 : CARD_GAP,
                    opacity,
                    transform: [{ scale }, { translateY }],
                  }}
                >
                  <HapticButton
                    haptic="medium"
                    scaleTo={0.98}
                    accessibilityLabel={entry.name}
                    onPress={() =>
                      index === activeIndex
                        ? selectTeam(entry.id)
                        : scrollToIndex(index)
                    }
                    style={[
                      styles.card,
                      { height: cardHeight, borderColor: `${entry.color}26` },
                    ]}
                  >
                    <View
                      style={[
                        styles.logoWrap,
                        { width: logoSize, height: logoSize },
                      ]}
                    >
                      <View
                        style={[
                          styles.halo,
                          {
                            width: haloSize,
                            height: haloSize,
                            borderRadius: haloSize / 2,
                            backgroundColor: entry.tint,
                          },
                        ]}
                      />
                      <Image
                        source={TEAM_LOGOS[entry.id]}
                        style={[
                          styles.logo,
                          { width: logoSize, height: logoSize },
                        ]}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                    </View>

                    <View style={styles.cardText}>
                      <Text
                        style={[styles.teamName, { color: entry.color }]}
                        numberOfLines={1}
                      >
                        {entry.name}
                      </Text>
                      <Text style={styles.tagline} numberOfLines={3}>
                        {entry.tagline}
                      </Text>
                    </View>

                    <View
                      style={[styles.rankPill, { backgroundColor: entry.tint }]}
                    >
                      <Text
                        style={[styles.rankPillText, { color: entry.color }]}
                      >
                        Platz {entry.rank} im Linzer Race
                      </Text>
                    </View>
                  </HapticButton>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          <View style={styles.dots}>
            {TEAMS.map((entry, index) => {
              const inputRange = [
                (index - 1) * snap,
                index * snap,
                (index + 1) * snap,
              ];
              return (
                <Animated.View
                  key={entry.id}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: entry.color,
                      opacity: scrollX.interpolate({
                        inputRange,
                        outputRange: [0.25, 1, 0.25],
                        extrapolate: "clamp",
                      }),
                      transform: [
                        {
                          scaleX: scrollX.interpolate({
                            inputRange,
                            outputRange: [1, 3.2, 1],
                            extrapolate: "clamp",
                          }),
                        },
                      ],
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <HapticButton
          haptic="heavy"
          style={styles.cta}
          accessibilityLabel={`${active.name} übernehmen`}
          onPress={() => selectTeam(active.id)}
        >
          <Crossfade colors={colors} scrollX={scrollX} snap={snap} />
          <Text
            style={styles.ctaText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {active.name} übernehmen →
          </Text>
        </HapticButton>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  glow: {
    position: "absolute",
  },
  safe: {
    // Ohne zIndex zeichnet Android die absolut positionierten Farbflaechen
    // ueber den gesamten Inhalt.
    flex: 1,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: THEME.spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: THEME.spacing.xs,
    fontSize: 34,
    fontWeight: "700",
    color: THEME.colors.text,
    letterSpacing: -0.8,
  },
  /** Nimmt den Raum zwischen Kopf und Button ein und zentriert die Karte darin. */
  stage: {
    flex: 1,
    justifyContent: "center",
  },
  rail: {
    flexGrow: 0,
  },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    borderWidth: 1.5,
    backgroundColor: THEME.colors.card,
    overflow: "hidden",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
  },
  logo: {
    zIndex: 1,
  },
  cardText: {
    marginTop: THEME.spacing.md,
    alignItems: "center",
  },
  teamName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: THEME.spacing.xs,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: THEME.colors.textMuted,
  },
  rankPill: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 10,
    marginTop: THEME.spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: THEME.radius.pill,
  },
  cta: {
    marginHorizontal: 24,
    marginBottom: THEME.spacing.md,
    height: 58,
    borderRadius: THEME.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ctaText: {
    zIndex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.onAccent,
    paddingHorizontal: THEME.spacing.md,
  },
});
