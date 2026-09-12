# AI Hackathon @ Ars Electronica 2026

Zwei-Personen-Team (Leo + Kollege) für den AI Hackathon des Ars Electronica Festivals,
**11.–12. September 2026, Grand Garage Linz**. Motto: *NEGOTIATING HUMANITY*.
Aufgabe: eine Anwendung, die den **Festival-Programmdatensatz** mit **Open Data der Stadt Linz** verbindet.
Ziel ist gewinnen.

## Die drei Regeln, aus denen alles folgt

1. **Es entscheidet Community Voting, keine Jury.** Was in 60 Sekunden nicht zündet, verliert.
   Die App ist eine native iOS-App und läuft auf einem Vorführ-iPhone, das beim Voting
   herumgereicht wird — **kein Web-Build, keine öffentliche URL, kein QR-Code.** Das war eine
   frühere Regel und ist auf ausdrückliche Entscheidung gefallen (Stand 11.09.2026).
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
| `app/` | **SELBERDENKEN** — Expo SDK 57 / React Native, Expo Router, `react-native-maps`. iOS und Android, beides in Expo Go |
| `tasks/todo.md` | Zwei-Tages-Plan · `tasks/lessons.md` Korrekturen |

## Befehle

```bash
python3 scripts/build_summary.py                    # data/SUMMARY.md neu erzeugen
TOOL=.agents/skills/ars-dataset/scripts/ars_dataset.py
python3 $TOOL download -o data/festival/ars-festival-2026.json   # Export aktualisieren
python3 $TOOL verify  data/festival/ars-festival-2026.json       # Integrität prüfen
python3 $TOOL summary data/festival/ars-festival-2026.json       # Kennzahlen
python3 scripts/build_quests.py                     # app/data/quests.json aus Realdaten
python3 scripts/build_graph.py                      # app/data/graph.json (Synapsen-Netz)
cd app && npx expo start                            # auf dem iPhone oder Android-Geraet oeffnen
cd app && npx tsc --noEmit                          # Typpruefung
```

## Design

`DESIGN.md` im Repo-Root ist die verbindliche Vorgabe für alles Sichtbare. Der Abschnitt
`## Override: SELBERDENKEN Neobrutalismus` gilt dabei vor dem Apple-Teil darüber — die App ist
seit 11.09.2026 heller Neobrutalismus, nicht mehr Dunkel-plus-Glas.

Die Tokens liegen in `app/theme/colors.ts` (`THEME.colors`, `THEME.category`, `THEME.type`,
`THEME.border`, `THEME.shadow`, `THEME.radius`, `THEME.spacing`) — **niemals Hex-Werte oder
Pixelmaße inline schreiben**, immer über die Tokens. Jede Fläche geht durch
`app/components/BrutSurface.tsx`, jedes Icon durch `app/components/Symbol.tsx`.
**Keine Emojis**, nirgends.

Die Regeln, an denen Entwürfe am ehesten scheitern:

- **Gelb ist die Aktionsfarbe und erscheint nur als Fläche, nie als Schrift.** Gelb auf Creme
  hat keinen Kontrast. Schrift auf Signalflächen ist schwarz (`colors.onSignal`).
- **Der harte Schatten ist eine eigene schwarze View**, keine Style-Prop. `elevation` auf
  Android zeichnet immer weich und ohne steuerbaren Versatz.
- **Jede Aufrufstelle braucht rechts und unten `shadow.offset` Luft**, sonst wird der Schatten
  abgeschnitten.
- **Fließtext 17px, nicht 16px**, Zeilenhöhe 25. Steht als `THEME.type.body` fertig bereit.
- **Gewicht 500 existiert nicht.** Die Leiter ist 300 / 400 / 600 / 700 / 800.
- **Druckzustand jedes Buttons.** `HapticButton` liefert `scale(0.95)` über `scaleTo` oder,
  auf Flächen mit Schatten, `pressStyle="push"`.
- **Jeder Button ist `app/components/BrutButton.tsx`.** Niemals `HapticButton + BrutSurface +
  Text` von Hand nachbauen und **niemals eine feste `height` in eine `contentStyle` von
  `BrutSurface` schreiben**: die Fläche polstert mit `spacing.md`, eine Höhe von 50 lässt dem
  Text 18px bei Zeilenhöhe 25 — die Schrift wird oben und unten abgeschnitten. Wenn Höhe nötig
  ist: `minHeight` plus eigenes `paddingVertical`.

Für Datenvisualisierung gilt: Kategorie heißt **Farbe und Form zugleich**, aus
`app/lib/categories.ts`. Karte und Synapsen-Netz lesen dieselbe Tabelle, damit sie nicht
auseinanderlaufen. Auf der Karte trägt die **Form immer die Art** — auch unentdeckt. Den
Entdeckungszustand tragen allein Größe, Füllung, Schatten und Name: entdeckt ist groß, farbig,
geschattet und beschriftet, unentdeckt klein, weiß und namenlos. Im Synapsen-Netz dagegen wird
Unentdecktes **gar nicht gezeichnet** — kein Umriss, kein Platzhalter, sonst sieht man das
fertige Netz, bevor man losgegangen ist.

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
