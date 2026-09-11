/**
 * Auf iOS zeichnet `expo-symbols` echte SF Symbols -- da gibt es nichts
 * vorzuladen. Die Android-Fassung dieser Datei (`symbolFont.android.ts`) holt
 * stattdessen die Material-Schrift, damit beim ersten Bild keine leeren
 * Kaestchen stehen. Metro waehlt die Datei nach Plattform; so landet die 1-MB-
 * Schriftdatei gar nicht erst im iOS-Bundle.
 */
export async function preloadSymbolFont(): Promise<void> {
  return;
}
