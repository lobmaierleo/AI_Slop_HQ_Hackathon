# Stand 12.09.2026 — Tag 2

**Feature-Freeze heute 13:00.** Danach nur noch Pitch und Stabilisierung.

## Offen

- [ ] **Gerätetest des Foto-Flows.** Der Subfenster-Umbau vom 12.09. ist nur durch `tsc`
      belegt. Kamera, Berechtigung, Auslöser und „Ohne Foto bestätigen" sind asynchron und
      damit ohne Gerät unbewiesen. `npx expo run:ios --device`
- [ ] **Ungeklärt: `TypeError: Cannot read property 'forEach' of null`** auf dem Karten-Tab,
      Stack `BrutSurface` ← `MapLegend`. Aus einem Debug-Lauf vom 11.09., also aus Code, den
      es nicht mehr gibt. Ausgeschlossen sind: fehlende Schatten-Tokens, ungültige
      Symbolnamen, unerlaubtes `MapView`-Kind. `MapFilterBar` baut dieselbe Struktur nach —
      der Fehler kann also live sein. Beim Gerätetest gezielt den Karten-Tab beobachten.
- [ ] **Release-Build für die Vorführung.**
      `npx expo run:ios --device --configuration Release` — ein Debug-Build hängt an Metro
      und ist ohne den Rechner tot.
- [ ] **Pitch.** `docs/pitch.md` gegen den tatsächlichen Stand der App durchgehen.

## Bekannte Restposten (bewusst offen gelassen)

- Fotos liegen als `file://`-URI im Cache. Über einen OS-Cache-Lauf hinweg kann ein Bild
  verschwinden; der Ort bleibt erledigt. Für die Demo unkritisch.
- `app/components/LiquidTabBar.tsx` heißt noch nach der Liquid-Glass-Phase, ist aber längst
  neobrutalistisch umgebaut. Nur der Name ist ein Rest. **Nicht vor dem Freeze umbenennen.**
- `app/data/leaderboard.json` hat kein Build-Skript, ist von Hand gepflegt.

---

# Erledigt 11.–12.09.2026

## Nachrüstung Quest-Detail, Karte, Netz

Quests waren eine Liste mit Knopf. Jetzt öffnet jede Quest ein Subfenster mit Karte, Kamera,
Hintergrundwissen und — an ausgewählten Orten — einer Runde Fakt oder Slop. Fakt oder Slop ist
als eigener Bereich verschwunden.

- **Quests sind Orte mit Subfenster.** `QuestDetailSheet` als `pageSheet`: Kopf mit
  Kategoriezeichen, Karte auf den Ort gezoomt, Kamera, Wissenstext, Kennzahlen, bei manchen
  Orten Fakt oder Slop, Fußzeile mit Datenquelle und Wassergewinn.
- **Man lernt etwas.** Je Ort ein handgeschriebener Absatz `info` ohne jede Zahl, dazu zwei
  bis fünf `stats`, die `build_quests.py` aus der Quellzeile rechnet. Die Trennung ist
  Absicht: Prosa veraltet nicht, Zahlen driften nicht, weil sie niemand abtippt. Neue Joins:
  Hotspot-Nutzung je Standort, Festivalprojekte je Spielort über den rekursiven
  `Linked Child`-Gang (Projekte hängen an Räumen, nicht an Gebäuden — vorher kamen Nordico 1
  und Kunstuni 0 heraus, jetzt OK Linz 27/24 und AEC 137/257), Höhenrang eines Baums über alle
  27.004 Bäume.
- **Fakt oder Slop** hängt an 11 der 23 Orte, 16 Aussagen, thematisch am jeweiligen Datensatz.
  Der Build bricht ab, wenn eine Aussage doppelt oder gar nicht vergeben ist. Sichtbar erst
  nach dem Besuch.
- **Kartenfilter nach Kategorie statt nach Datenquelle.** „Orte / Spielorte / Brunnen" war
  eine Beschreibung unserer Dateien, keine Frage, die ein Mensch stellt. Jetzt die fünf
  Kategorien aus `lib/categories.ts`, und eine aktive Kategorie blendet den ganzen Linzer
  Datensatz dahinter ein. Der Filter heißt damit „zeig mir alles dieser Art in der Stadt,
  meine Orte darin" — die strukturelle Verschränkung, auf die es beim Voting ankommt.
- **Orte auf der Karte unterscheidbar.** Die Kategorieform trägt beide Zustände; Tipp auf
  einen Marker öffnet dasselbe Sheet wie die Liste.
- **Mein Netz zeichnet nichts vor.** Nur entdeckte Knoten und aktive Kanten, Leerzustand
  statt Geisternetz, Pinch bis 4×, Doppeltipp setzt zurück.

## Abgeschnittene Knopfbeschriftungen

Ursache war nicht der einzelne Knopf: `BrutSurface` polstert mit `spacing.md`, und acht
Aufrufstellen setzten wortgleich `height: 50` in die `contentStyle`. `BrutButton` ersetzt alle
acht. Regel in `CLAUDE.md` und `DESIGN.md`, Ursachenanalyse in `lessons.md`.

## Foto-Flow repariert (12.09.)

Drei Fehler derselben Art — stille Fehlerzweige:

1. Kein `onCameraReady`-Zustand; `takePictureAsync` warf, und der `catch`-Zweig schloss die
   Kamera. Jeder zu frühe Tipp warf zurück an den Anfang.
2. `captureFailed` wurde gesetzt und nirgends gerendert. Jeder Fehlschlag endete stumm.
3. Bestätigen ohne Foto ließ den Beweis-Abschnitt kommentarlos verschwinden.

Dazu: Kamera als Vollbild statt als 260px-Fenster im Fließtext, und der Zweitknopf auf volle
Breite (`alignSelf` saß in `HapticButton` auf der inneren Fläche, die Trefferfläche lag
darüber voll breit).

## Aufräumen (12.09.)

Gelöscht: `docs/spec.md` (beschrieb „AI SLOPPY" mit Team-Carousel, Liquid-Glass-Tableiste und
Fakt oder Slop als Quests-Bereich — nichts davon existiert noch), `scripts/build_app_data.py`
(schrieb nach `app/public/`, Next.js-Zeit), `scripts/build_logos.py` (las aus einem Pfad auf
einem fremden Rechner, Logos sind seit f9e52d9 raus), `scripts/generate_slop_data.py` (von
`build_quests.py` abgelöst), `app/dist/` und das leere `app/assets/`.

Neu geschrieben: `README.md` (enthielt `npm run dev` auf localhost:3000). Umgestellt:
`DESIGN.md` — der verbindliche Neobrutalismus-Teil steht jetzt oben, die Apple-Analyse
darunter als ausdrücklich historische Referenz.
