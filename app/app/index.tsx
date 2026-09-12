import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrutButton } from '@/components/BrutButton';
import { BrutSurface, type Tone } from '@/components/BrutSurface';
import { Symbol } from '@/components/Symbol';
import type { SymbolName } from '@/components/Symbol';
import { useGameStore } from '@/state/useGameStore';
import { THEME } from '@/theme/colors';

/** Die drei Versprechen des Onboardings: Ortsbesuch, Ersparnis, Netz. */
const PROMISES: { symbol: SymbolName; tone: Tone; title: string; desc: string }[] = [
  {
    symbol: 'figure.walk',
    tone: 'primary',
    title: 'Vor Ort hingehen',
    desc: 'Selbst nachsehen, statt zu fragen.',
  },
  {
    symbol: 'drop.fill',
    tone: 'tertiary',
    title: 'Kühlwasser einsparen',
    desc: 'Jede Entdeckung ersetzt eine Abfrage.',
  },
  {
    symbol: 'brain',
    tone: 'secondary',
    title: 'Ein eigenes Netz knüpfen',
    desc: 'Jeder gefundene Ort wird ein Neuron.',
  },
];

/**
 * Erster Eindruck der App: die Ansage, dass man selbst die Intelligenz ist.
 * Drei Karten, drei Signalfarben, ein Knopf -- nichts, was erklärt werden muss.
 */
export default function OnboardingScreen() {
  const { start } = useGameStore();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ARS ELECTRONICA 2026 · NEGOTIATING HUMANITY</Text>
          <Text style={styles.headline}>Verlerne nicht das Suchen.</Text>
          <Text style={styles.body}>
            Künstliche Intelligenz nimmt uns das Nachdenken ab und verdunstet dabei literweise
            Kühlwasser. Hol dir die Neugier zurück.
          </Text>
        </View>

        <View style={styles.rows}>
          {PROMISES.map((item) => (
            <BrutSurface key={item.title} tone={item.tone} contentStyle={styles.rowContent}>
              <View style={styles.rowIcon}>
                <Symbol name={item.symbol} size={22} color={THEME.colors.ink} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
            </BrutSurface>
          ))}
        </View>

        <BrutButton label="Eigenes Netz aktivieren" size="lg" haptic="heavy" onPress={start} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  header: {
    gap: THEME.spacing.sm,
  },
  eyebrow: {
    ...THEME.type.eyebrow,
    color: THEME.colors.text,
  },
  headline: {
    ...THEME.type.display,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
  },
  body: {
    ...THEME.type.body,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
  },
  rows: {
    gap: THEME.spacing.sm,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.sm,
    borderWidth: THEME.border.thin,
    borderColor: THEME.border.color,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...THEME.type.bodyStrong,
    color: THEME.colors.text,
  },
  rowDesc: {
    ...THEME.type.caption,
    color: THEME.colors.textMuted,
  },
});
