# SELBERDENKEN

Eine native iOS-App, die Linz zu Fuß erschließt und dabei vorführt, wo künstliche Intelligenz
sich irrt. Entstanden beim AI Hackathon des Ars Electronica Festivals, 11.–12. September 2026,
Grand Garage Linz, zum Motto *NEGOTIATING HUMANITY*.

## Die Idee

Die naheliegende Antwort auf ein Festivalprogramm plus einen Stadtdatensatz ist ein Chatbot, der
einem sagt, wo man hingehen soll. SELBERDENKEN macht das Gegenteil: Die App behauptet nichts,
sondern schickt einen hin.

Zu jedem Ort steht die Antwort einer Sprachmodell-Anfrage neben dem amtlichen Katastereintrag.
Am Hauptplatz etwa behauptet die KI mit voller Überzeugung, es gebe dort keinen Trinkbrunnen,
die Brunnen seien historische Zierbrunnen ohne Trinkwasserqualität. Der Trinkbrunnen-Kataster der
Stadt Linz führt an derselben Stelle den Auslauf TB74, Trinkwasser ja. Wer hingeht, sieht selbst,
wer recht hat.

Die KI-Antworten sind vorberechnet und liegen als statische Daten in der App. Zur Laufzeit
passiert kein einziger Modellaufruf — die App braucht kein Netz.

## Was die App macht

Vier Bereiche:

- **Übersicht** — Fortschritt, ein Tagesvorschlag, gespartes Flaschenwasser in Litern.
- **Quests** — 23 Orte in Linz, jeder mit KI-Behauptung, Katasterbefund und Quelle. Dazu
  18 Trivia-Fragen. Die Verteilung: 8 aus dem Baumkataster, 7 Trinkwasser, 4 Festival-Zentren,
  2 Freiluft-Kunst, 2 Zeitzeugen-Orte.
- **Karte** — die Quests als Kategorieformen, dazu 71 Festival-Spielorte und 84 Trinkbrunnen
  als Kontextebene. Form trägt die Art, Größe und Farbe den Entdeckungsstand.
- **Mein Netz** — das Synapsen-Netz aus 23 Knoten und 43 Datenbrücken. Gezeichnet wird nur,
  was man selbst erlaufen hat.

Bestätigt man vor Ort einen Fund, rastet die zugehörige Datenbrücke ein. Unentdecktes erscheint
im Netz gar nicht — sonst sähe man das fertige Bild, bevor man losgegangen ist. Statt eines
Routenpfeils zeigt das Detail-Sheet eine Kompassnadel, die sich mit dem Gerät im Raum dreht.

## Die Verschränkung der beiden Datenwelten

Gefordert war eine Verbindung von Festivalprogramm und Linzer Open Data, die ohne beide Seiten
nicht existieren könnte. Festivalorte auf einen Stadtplan zu legen erfüllt das nicht.

Die Datenbrücken im Synapsen-Netz sind diese Verbindung: Jede Kante verknüpft einen Festivalort
mit einem städtischen Befund an derselben Stelle — ein Spielort, an dem zugleich kostenloses
Trinkwasser aus dem Kataster kommt, ein Diskursformat im Landhaus, das auf dessen dokumentierte
Geschichte trifft. Die Quellenangaben der Quests führen das mit: neben *Trinkbrunnen Linz* und
*Baumkataster Linz* stehen *Landhaus Linz × Festival Diskurs* und *STWST Linz × Festival 2026*.

## Daten

- **Festival:** `data/festival/ars-festival-2026.json` — 886 Projekte, 779 Zeitslots,
  511 Künstler:innen aus 107 Ländern, 156 Orte.
- **Stadt Linz:** `data/linz/` — 23 Open-Data-Sätze, 13 davon mit lokalen Dateien. In der App
  stecken vor allem Trinkbrunnen-Kataster und Baumkataster.

Eine generierte Übersicht liegt in [`data/SUMMARY.md`](data/SUMMARY.md). Die Rohdaten sind groß;
die Projektbeschreibungen allein umfassen rund 177.000 Tokens.

Aus den Rohdaten erzeugen vier Skripte die Spieldaten unter `app/data/`:

```bash
python3 scripts/build_summary.py   # data/SUMMARY.md
python3 scripts/build_quests.py    # app/data/quests.json
python3 scripts/build_graph.py     # app/data/graph.json
python3 scripts/build_places.py    # app/data/places.json
```

## Technik

Expo SDK 57 auf React Native 0.86 mit Expo Router, `react-native-maps` auf Apple Maps,
`react-native-svg` für die Kategorieformen. Der Fortschritt liegt lokal auf dem Gerät.

Die Oberfläche ist durchgehender Neobrutalismus: harte schwarze Versatzschatten als eigene
Flächen statt weicher Schatten-Props, Gelb ausschließlich als Fläche und nie als Schrift,
Haptik an jedem Zustandswechsel. Die Vorgaben stehen in [`DESIGN.md`](DESIGN.md), die Tokens
in `app/theme/colors.ts`.

## Starten

```bash
cd app
npm install
npx tsc --noEmit                                    # Typprüfung
npx expo run:ios --device                           # Debug-Build aufs iPhone, mit Logausgabe
npx expo run:ios --device --configuration Release   # eigenständiger Build
```

Ein Debug-Build lädt sein JavaScript bei jedem Start von Metro und ist ohne den Rechner tot.
Für den Einsatz unterwegs zählt der Release-Build.

Standort, Kompass und Kamera gibt es im Simulator nicht — die App will ein echtes Gerät.

## Repository

| Pfad | Inhalt |
|---|---|
| `app/` | die iOS-App (Expo, React Native, Expo Router) |
| `data/festival/`, `data/linz/` | Rohdaten beider Welten |
| `scripts/` | Aufbereitung der Rohdaten zu Spieldaten |
| `docs/` | Briefing, Datenkatalog mit Join-Regeln, Ideensammlung, Pitch |
| `tasks/` | Arbeitsstand und festgehaltene Korrekturen |

Die Arbeitsregeln für das Projekt stehen in [`CLAUDE.md`](CLAUDE.md), das Gestaltungsregelwerk
in [`DESIGN.md`](DESIGN.md).
