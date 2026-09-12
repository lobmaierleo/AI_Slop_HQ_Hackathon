# AI Hackathon @ Ars Electronica Festival 2026

Arbeitsrepository für den AI Hackathon am **11.–12. September 2026** in der Grand Garage, Linz.
Thema: *NEGOTIATING HUMANITY*. Aufgabe: den Festival-Programmdatensatz mit Open Data der Stadt
Linz verbinden. Gewertet wird per Community Voting.

Das Ergebnis ist **SELBERDENKEN**, eine native iOS-App unter `app/` (Expo SDK 57, React Native,
Expo Router). Sie läuft beim Voting auf einem Vorführ-iPhone, das herumgereicht wird — es gibt
bewusst keinen Web-Build, keine öffentliche URL und keinen QR-Code.

## Einstieg

```bash
python3 scripts/build_summary.py                    # data/SUMMARY.md erzeugen
python3 scripts/build_quests.py                     # app/data/quests.json aus Realdaten
python3 scripts/build_graph.py                      # app/data/graph.json (Synapsen-Netz)
python3 scripts/build_places.py                     # app/data/places.json (Kartenkontext)

cd app
npx tsc --noEmit                                    # Typprüfung
npx expo start                                      # schneller Blick über Expo Go
npx expo run:ios --device                           # Debug-Build aufs iPhone, mit Logausgabe
npx expo run:ios --device --configuration Release   # der Stand für die Vorführung
```

Für die Vorführung zählt nur der letzte Befehl: ein Debug-Build lädt sein JavaScript bei jedem
Start von Metro und ist ohne den Rechner tot.

Danach in dieser Reihenfolge lesen:

1. [`CLAUDE.md`](CLAUDE.md) — die Regeln, aus denen alles folgt (= `AGENTS.md` = `GEMINI.md`)
2. [`DESIGN.md`](DESIGN.md) — verbindlich für alles Sichtbare, der Neobrutalismus-Teil zuerst
3. [`docs/briefing.md`](docs/briefing.md) — wie der Bewerb funktioniert und was die Konkurrenz baut
4. [`docs/datasets.md`](docs/datasets.md) — was in den Daten steckt und welche Joins halten
5. [`tasks/todo.md`](tasks/todo.md) — offener Stand · [`tasks/lessons.md`](tasks/lessons.md) Korrekturen

## Daten

- **Festival:** `data/festival/ars-festival-2026.json` — 886 Projekte, 779 Zeitslots,
  511 Künstler:innen aus 107 Ländern, 156 Orte
- **Linz:** `data/linz/` — 23 Datensätze, 13 davon mit lokalen Dateien

Übersicht in [`data/SUMMARY.md`](data/SUMMARY.md). Rohdaten nicht in ein Kontextfenster laden —
die Projektbeschreibungen allein sind rund 177k Tokens.

## Agents

Claude Code, Codex und Antigravity lesen denselben Kontext (`CLAUDE.md` = `AGENTS.md` = `GEMINI.md`).
Die vier offiziellen Hackathon-Skills liegen in `.agents/skills/`.
