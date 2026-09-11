import { Component, ReactNode } from "react";
import { Text, View } from "react-native";
import { colors, radius, space } from "@/theme/tokens";
import { type } from "@/theme/type";

/**
 * Lektion vom 9.9.: ein Fehler in einer Komponente riss die ganze Seite ab.
 * Beim Community Voting kommen fremde Geräte auf die App — eine einzelne
 * Kachel darf die App nie mitnehmen. Deshalb liegt jede Pane hier drin.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    console.warn("Pane abgefangen:", this.props.label, err);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ paddingHorizontal: space.md, paddingVertical: space.lg }}>
        <View
          style={{
            backgroundColor: colors.canvasParchment,
            borderRadius: radius.lg,
            padding: space.md,
          }}
        >
          <Text style={[type.bodyStrong, { marginBottom: space.xxs }]}>
            Diese Ansicht ist kollabiert.
          </Text>
          <Text style={[type.caption, { color: colors.inkMuted48 }]}>
            Passend zum Thema. Der Rest der App läuft weiter.
          </Text>
        </View>
      </View>
    );
  }
}
