# AI Hackathon @ Ars Electronica 2026

Zwei-Personen-Team (Leo + Kollege) für den AI Hackathon des Ars Electronica Festivals,
**11.–12. September 2026, Grand Garage Linz**. Motto: *NEGOTIATING HUMANITY*.
Aufgabe: eine Anwendung, die den **Festival-Programmdatensatz** mit **Open Data der Stadt Linz** verbindet.
Ziel ist gewinnen.

## Die drei Regeln, aus denen alles folgt

1. **Es entscheidet Community Voting, keine Jury.** Das Publikum muss die Sache am eigenen Handy
   ausprobieren können — öffentliche URL plus QR-Code ist Pflicht. Was in 60 Sekunden nicht zündet,
   verliert.
2. **Beide Datenwelten müssen strukturell verschränkt sein.** Festivalorte auf einer Linz-Karte zu
   zeigen erfüllt das Kriterium nicht. Es zählt eine Verbindung, die ohne beide Datensätze nicht
   existieren könnte.
3. **Verbrannte Ideen:** Umkreissuche, Tagesplaner, Festivalkalender, Programm-Chatbot. Das sind die
   vier offiziellen Beispielprojekte — halbe Konkurrenz baut Varianten davon.

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `docs/briefing.md` | Bewerb, Ablauf, Voting-Mechanik, Konkurrenzlage, Risiken |
| `docs/datasets.md` | Datenkatalog mit **Join-Regeln und Fallstricken** — vor jedem Datenzugriff lesen |
| `docs/ideas.md` | 29 Ideen mit Aufwand, Risiko und Voting-Argument |
| `docs/pitch.md` | Pitch-Gerüst und Voting-Taktik |
| `data/SUMMARY.md` | **Generierte Datenübersicht. Diese lesen, niemals die Rohdaten.** |
| `data/festival/` | Festival-Export (886 Projekte, 779 Slots, 511 Kontakte, 156 Orte) |
| `data/linz/` | 23 Linzer Datensätze, je mit eigener `README.md` |
| `data/derived/` | Abgeleitetes, gitignored (Embeddings o. ä.) |
| `app/` | Next.js 15 + Tailwind + MapLibre. **Live: https://ars-hackathon-2026.vercel.app** — jeder Push auf `main` deployt automatisch |
| `tasks/todo.md` | Zwei-Tages-Plan · `tasks/lessons.md` Korrekturen |

## Befehle

```bash
python3 scripts/build_summary.py                    # data/SUMMARY.md neu erzeugen
TOOL=.agents/skills/ars-dataset/scripts/ars_dataset.py
python3 $TOOL download -o data/festival/ars-festival-2026.json   # Export aktualisieren
python3 $TOOL verify  data/festival/ars-festival-2026.json       # Integrität prüfen
python3 $TOOL summary data/festival/ars-festival-2026.json       # Kennzahlen
cd app && npm run dev                               # localhost:3000
```

## Arbeitsregeln

- **Rohdaten nie ins Kontextfenster.** Die Projektbeschreibungen allein sind ~177k Tokens.
  Immer `data/SUMMARY.md` lesen, dann gezielt mit Python filtern.
- **Joins nicht raten.** `docs/datasets.md` hält fest, was auflösbar ist und was kaputt ist —
  `calendar["Linked Location"]` etwa ist unbrauchbar. Nicht „reparieren".
- **Kein LLM-Call im Demo-Pfad.** Das WLAN vor Ort ist ein Risiko und wir haben kein
  Hackathon-Budget. LLM-Arbeit vorberechnen, Ergebnisse statisch ausliefern.
- **Feature-Freeze Samstag 13:00.** Danach nur noch Pitch und Stabilisierung.

## Agent-Setup

Primär **Claude Code**, bei Token-Ende **Antigravity** oder **Codex**. `AGENTS.md` und `GEMINI.md`
sind Symlinks auf diese Datei — alle drei lesen denselben Kontext.

Vier offizielle Hackathon-Skills liegen in `.agents/skills/` (für alle drei Agents installiert):
`ars-dataset` (Festivaldaten), `hackathon-datasets` (Linzer Daten finden und laden),
`opendata-linz-converter` (Linz-Daten konvertieren), `design-ars-festival-ui` (Designsprache des
Festivals). Aktualisieren mit `npx skills@latest update --project --yes`.
