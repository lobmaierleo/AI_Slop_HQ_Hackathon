import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { bearing } from '@/lib/net';
import { useUserLocation } from '@/lib/useUserLocation';
import { THEME } from '@/theme/colors';

type Props = {
  lat: number;
  lon: number;
  size?: number;
};

/** Modulo, das auch fuer negative Zahlen im Bereich 0..n bleibt. */
function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/**
 * Eine Nadel, die auf einen Ort zeigt und sich mit dem Geraet mitdreht.
 *
 * Peilung aus dem eigenen Standort (Provider, einmal fuer die ganze App)
 * minus dem Heading des Magnetometers -- expo-location liefert es ohne
 * weiteres Native-Modul. Das Heading-Abo lebt nur, solange diese Komponente
 * gemountet ist, also nur im offenen Sheet eines unentdeckten Orts; das
 * Sheet selbst wird an der Aufrufstelle bedingt eingehaengt, deshalb gibt es
 * nie zwei Abos nebeneinander.
 *
 * Jedes Heading-Ereignis dreht nur diese Nadel, nicht das Sheet: der Winkel
 * ist ein Shared Value und geht am React-Render vorbei.
 */
export function HeadingNeedle({ lat, lon, size = 40 }: Props) {
  const position = useUserLocation();
  const angle = useSharedValue(0);
  /** Der zuletzt angesteuerte Winkel, kumuliert -- damit der kuerzeste Weg berechnet werden kann. */
  const shown = useRef(0);
  const seen = useRef(false);
  const [hasHeading, setHasHeading] = useState(false);
  /** Peilung aendert sich mit dem Standort; das Abo darf deshalb nicht daran haengen. */
  const target = position ? bearing(position.lat, position.lon, lat, lon) : null;
  const targetRef = useRef(target);
  targetRef.current = target;
  const hasPosition = position !== null;

  useEffect(() => {
    // Ohne Standort gibt es keine Peilung -- und ohne Freigabe wuerde das
    // Heading-Abo ohnehin nur ablehnen. Erst abonnieren, wenn beides da ist.
    if (!hasPosition) return;
    let alive = true;
    let sub: Location.LocationSubscription | undefined;
    Location.watchHeadingAsync((h) => {
      // trueHeading ist -1, solange iOS keine Deklination kennt -- dann magnetisch.
      const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      const to = targetRef.current;
      if (to === null || !Number.isFinite(heading)) return;
      const next = to - heading;
      // Kuerzester Weg, sonst dreht die Nadel bei 359 -> 1 einmal ganz herum.
      const delta = mod(next - shown.current + 180, 360) - 180;
      shown.current += delta;
      angle.value = withTiming(shown.current, { duration: 140 });
      if (!seen.current) {
        seen.current = true;
        setHasHeading(true);
      }
    })
      .then((s) => {
        // Unmount vor der Aufloesung des Promises: sonst liefe das Abo weiter.
        if (alive) sub = s;
        else s.remove();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [angle, hasPosition]);

  const rotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  if (!position) return null;

  const offset = THEME.shadow.offsetSm;
  const box = size + offset;

  return (
    // Bis das erste Heading da ist, steht die Nadel blass -- eine Nadel, die
    // in eine falsche Richtung zeigt, waere schlimmer als gar keine.
    <View style={{ width: box, height: box, opacity: hasHeading ? 1 : 0.35 }}>
      {/* Der harte Schatten als eigene, feststehende Flaeche hinter der Nadel. */}
      <Svg width={box} height={box} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2 + offset} cy={size / 2 + offset} r={size / 2 - 1.5} fill={THEME.shadow.color} />
      </Svg>
      <Animated.View style={[{ width: size, height: size }, rotation]}>
        <Svg width={size} height={size} viewBox="0 0 44 44">
          <Circle cx={22} cy={22} r={20} fill={THEME.colors.primary} stroke={THEME.colors.ink} strokeWidth={3} />
          <Polygon points="22,5 29,28 22,23 15,28" fill={THEME.colors.ink} strokeLinejoin="round" />
          <Circle cx={22} cy={22} r={2.5} fill={THEME.colors.primary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default HeadingNeedle;
