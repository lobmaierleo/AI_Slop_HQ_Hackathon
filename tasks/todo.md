# AI SLOPPY — Neuimplementierung nach docs/spec.md

Stand: 11.09.2026. Plan: `~/.claude/plans/wir-bauen-die-app-harmonic-fairy.md`

## Wave 0 — Fundament (Kontrakt)

- [x] `app/theme/colors.ts` — THEME nach Spec §3 (primary #FF5C00, radius.lg 28)
- [x] `app/data/quests.json` — 5 Foto-Quests + 6 Trivia, echte Linz-Daten
- [x] `app/state/useGameStore.ts` — React Context, TEAMS, Actions
- [x] `app/components/HapticButton.tsx` — Haptik + scale(0.96)
- [x] `npx tsc --noEmit` auf dem Fundament: sauber

## Wave 1 — drei parallele Subagenten

- [x] A: `components/LiquidTabBar.tsx`, `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `app/index.tsx`
- [x] B: `components/StatCard.tsx`, `app/(tabs)/index.tsx`
- [x] C: `components/PhotoQuestCard.tsx`, `components/FactOrSlopCard.tsx`, `app/(tabs)/quests.tsx`

## Wave 2 — Verifikation

- [x] `npx tsc --noEmit` über das Gesamtprojekt — fehlerfrei
- [x] `npx expo export -p web` — 791 Module, 1,2 MB, fehlerfrei
- [x] Dev-Server auf :8081 antwortet mit 200, Bundle 4,0 MB
- [x] Spec-Checkliste: genau 2 Tabs, keine Sub-Routen, kein Absatz > 2 Zeilen,
      jede interaktive Fläche mit Haptik + scale(0.96)

## Datengrundlage (verifiziert gegen die Rohdaten)

| Quelle | Eintrag |
|---|---|
| `data/linz/trinkbrunnen/Trinkbrunnen.csv` | TB74 Hauptplatz, TB77 Volksgarten, TB27 Donaupark, BoP03 Promenade |
| `data/linz/baumkataster/Baumkataster.csv` | #049 Linde 27 m, #086 Winter-Linde 26 m |
| `data/festival/ars-festival-2026.json` | „Glitch & Leak: Overflowing Bodies in Public Spaces" existiert |
| `data/linz/baumkataster/README.md` | 27.004 Bäume — bestätigt Trivia t3 |

## Entscheidungen

- State als React Context statt zustand — spart eine Dependency, Spec erlaubt beides.
- Animationen über RN-Core `Animated` statt Reanimated — kein Babel-/Worklets-Risiko.
- Icons als Emoji — `@expo/vector-icons` ist nicht installiert, `expo-symbols` bricht auf Web.
- Foto-Scan als Mock ohne `expo-image-picker` — Spec §7.2 fordert genau diesen Fallback,
  eine native Dependency hätte einen iOS-Prebuild erzwungen.

## Review

Umgesetzt in drei Wellen: Fundament (Kontrakt) von Hand, danach drei parallele Sonnet-Agenten
auf disjunkten Dateien, zuletzt Verifikation.

Nachgezogen nach dem Agentenlauf: elf Inline-Hex-Werte (`#FFFFFF`, `#ECECEF`) verstießen gegen
die Projektregel und laufen jetzt über die neuen Tokens `THEME.colors.onAccent` und
`THEME.colors.track`.

Belege:
- `npx tsc --noEmit` — keine Ausgabe, Exit 0
- `npx expo export -p web` — 791 Module gebündelt
- `curl localhost:8081` — HTTP 200, Metro-Bundle 4,0 MB nach der Token-Umstellung
- Genau 2 `Tabs.Screen`, keine Sub-Routen unter `app/(tabs)/`
- Kein UI-String über 90 Zeichen
- Einziges rohes `Pressable` steckt in `LiquidTabBar.tsx` und feuert dort `Haptics.selectionAsync()`;
  alles andere läuft über `HapticButton` mit `scale(0.96)`

Offen: Der Foto-Scan ist ein Mock ohne `expo-image-picker` (Spec §7.2 fordert genau diesen
Fallback). Echte Kamera wäre nachrüstbar, erzwingt aber einen iOS-Prebuild.
