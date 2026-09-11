import { useMemo } from "react";
import { StyleProp, Text, TextStyle } from "react-native";
import { colors } from "@/theme/tokens";
import { type } from "@/theme/type";
import { drift } from "@/engine/fixtures";

/**
 * Der Kontext-Kollaps. Ab dem Drift-Schwellwert ersetzt das Modell
 * Fachbegriffe durch Linzer Straßennamen — je höher der Drift, desto mehr.
 */
export function GlitchText({
  children,
  drift: level,
  style,
  numberOfLines,
}: {
  children: string;
  drift: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const text = useMemo(() => {
    if (level <= 0) return children;
    const share = Math.min(1, level / 100);
    let out = children;
    for (const d of drift) {
      if (!out.includes(d.from)) continue;
      // Deterministisch: derselbe Begriff kippt beim selben Driftwert immer gleich.
      const bite = ((d.from.charCodeAt(0) % 10) + 1) / 12;
      if (share >= bite) out = out.split(d.from).join(d.to);
    }
    return out;
  }, [children, level]);

  const broken = text !== children;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        type.body,
        broken && { color: colors.inkMuted48, fontStyle: "italic" },
        style,
      ]}
    >
      {text}
    </Text>
  );
}
