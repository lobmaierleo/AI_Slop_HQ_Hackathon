# AI Hackathon @ Ars Electronica Festival 2026

Arbeitsrepository für den AI Hackathon am **11.–12. September 2026** in der Grand Garage, Linz.
Thema: *NEGOTIATING HUMANITY*. Aufgabe: den Festival-Programmdatensatz mit Open Data der Stadt
Linz verbinden. Gewertet wird per Community Voting.

## Einstieg

```bash
git clone <repo> && cd AI_Slop_HQ_Hackathon
python3 scripts/build_summary.py      # Datenübersicht erzeugen
cd app && npm install && npm run dev  # localhost:3000
```

Danach in dieser Reihenfolge lesen:

1. [`docs/briefing.md`](docs/briefing.md) — wie der Bewerb funktioniert und was die Konkurrenz baut
2. [`docs/ideas.md`](docs/ideas.md) — 29 Ideen, bewertet nach Aufwand, Risiko und Voting-Chance
3. [`docs/datasets.md`](docs/datasets.md) — was in den Daten steckt und welche Joins halten
4. [`tasks/todo.md`](tasks/todo.md) — Zwei-Tages-Plan

## Daten

- **Festival:** `data/festival/ars-festival-2026.json` — 886 Projekte, 779 Zeitslots,
  511 Künstler:innen aus 107 Ländern, 156 Orte
- **Linz:** `data/linz/` — 23 Datensätze, 13 davon mit lokalen Dateien

Übersicht in [`data/SUMMARY.md`](data/SUMMARY.md). Rohdaten nicht in ein Kontextfenster laden.

## Agents

Claude Code, Codex und Antigravity lesen denselben Kontext (`CLAUDE.md` = `AGENTS.md` = `GEMINI.md`).
Die vier offiziellen Hackathon-Skills liegen in `.agents/skills/`.
