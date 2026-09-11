import { loadAsync } from 'expo-font';
import regular from 'expo-symbols/androidWeights/regular';

/**
 * `SymbolView` laedt die Material-Schrift selbst, aber erst beim Einhaengen --
 * bis dahin bleibt jedes Icon eine leere Flaeche. Einmal beim Start vorladen
 * nimmt diesen Frame weg. `loadAsync` merkt sich das Ergebnis, die spaeteren
 * Aufrufe der Komponente kosten dann nichts mehr.
 *
 * Auf Android ignoriert `expo-symbols` das Gewicht und nimmt immer Regular,
 * deshalb reicht diese eine Schrift.
 */
export async function preloadSymbolFont(): Promise<void> {
  await loadAsync({ [regular.name]: regular.font }).catch(() => undefined);
}
