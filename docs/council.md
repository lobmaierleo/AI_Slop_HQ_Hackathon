# Council 12.09.2026, 11:10 Uhr

Drei Ideengeber mit je drei Vorschlägen (Publikum, Daten, Produkt; Haiku), ein Richter (Sonnet).
Die Frage: Was macht die App in der letzten Stunde vor dem Freeze deutlich cooler, ohne sie
voller zu machen? Maßstab in dieser Reihenfolge: bleibt beim Herumreichen in 30 Sekunden hängen,
macht die Verschränkung Festival × Linz sichtbar, ist bis 13:00 risikoarm baubar, passt zum Stil.

## Gebaut (Stand 11:45)

1. **Synapsen auf der Karte** (Publikum, vom Richter auf Platz 1). Die 42 Kanten des Netzes
   liegen jetzt auch auf der echten Karte, an ihren Koordinaten: aktive Datenbrücke dick
   schwarz-gelb, verwandte Orte dünn schwarz. Eine Datenbrücke, von der erst ein Ende entdeckt
   ist, erscheint gestrichelt — der Hinweis, wohin der nächste Weg führt. Nur `map.tsx`, keine
   neue Pipeline; die Linien hängen an Entdeckungsstand und Filter, nie an einer Geste.
2. **Entdeckungsstempel und neue Synapsen im Sheet** (Produkt, Platz 2, um die Verschränkung
   ergänzt). Beim Fund schlägt ein gelber „ENTDECKT"-Stempel auf den Beweis, mit doppeltem
   Haptikschlag. Darunter stehen die Verbindungen, die es genau jetzt neu gibt: „Datenbrücke ·
   Freies WLAN — Hotspot Hauptplatz". Der Moment sagt selbst, welche zwei Datensätze sich hier
   berühren.

Dazu, außerhalb des Councils: Knopf „Alle Orte" auf der Karte (zurück zur ganzen Stadt nach dem
Hineinzoomen), Kamera-Pfad mit sichtbarem Fehlersatz für jeden Zweig und automatischer Neuprüfung
nach dem Rückweg aus den iOS-Einstellungen.

## Empfohlen, aber Teamentscheidung

- **Leaderboard streichen** (Produkt und Richter, Platz 3). Argument: Die erfundenen
  Mitspielenden versteht in 60 Sekunden niemand, und erfundene Daten widersprechen der These der
  App. Nicht umgesetzt, weil es ein bewusst gebautes Element entfernt — bitte zu zweit entscheiden.

## Verworfen

- **Liter-Explosion** (Publikum): hübsch, zeigt aber nichts von der Verschränkung.
- **Crowd-Quiz-Leaderboard** (Publikum): neue Zahlenwand mit erfundenen Prozentwerten.
- **Nachbarschaft** (Produkt): stärkste Fassung von Idee 1, aber 55 Minuten und Live-Geologik.
- **Stempel-Leiste** (Produkt): Layout-Politur ohne Bezug zur Verschränkung.
- **Künstlerherkunft × Gästestatistik, Festival-Kategorie × Baumarten, Zeitslots × Linztermine**
  (Daten): saubere Joins, aber alle drei sind neue Inhaltsblöcke mit eigener Pipeline. Nicht vor
  13:00 und gegen „nicht überladen". Die Datei lag zudem in einem falsch geschriebenen Pfad, der
  Richter sah sie nicht; die Bewertung stammt vom Orchestrator.

## Pitch-Satz des Richters

„Wo du selbst hingehst, zeigt dir das Netz live, wo Linz und das Festival sich wirklich berühren —
nicht nebeneinander auf einer Karte, sondern als Brücke, die erst durch deinen eigenen Fund
aufleuchtet."

---

# Council 12.09.2026, 11:30 Uhr — Runde 2: „deutlich beeindruckender"

Vier Ideengeber (Publikum, Daten, Produkt: Haiku; Orchestrator: Claude), 16 Ideen. Der
Sonnet-Richter blieb zweimal hängen und wurde abgebrochen; das Urteil stammt vom Orchestrator.
Brief und Ideendateien liegen im Session-Scratchpad (`council2/`). Zwei Stufen: BLITZ (unter
45 Minuten, keine Pipeline) und GROSS (1–3 Stunden). Maßstab wie in Runde 1: Wow in 30 s am
herumgereichten Gerät, Verschränkung sichtbar, Zeit/Risiko, Stil und These.

Bei der Rohdatenprüfung für den Brief zwei Korrekturen, die mehrere Ideen betreffen:
**Straßennamen und Linztermine haben keine Koordinaten**, und die Gästestatistik ist stadtweit
je Quartal, nie je Spielort. Und: `expo-location` liefert `watchHeadingAsync`, ein Kompass
braucht kein neues Native-Modul.

## Rangliste BLITZ

1. **Netz-Replay** (Orchestrator) · ~30 min. Knopf im Netz-Tab: das Netz leert sich und wächst in
   der echten Fund-Reihenfolge nach, ein Haptikschlag je Knoten, Datenbrücken gelb. `completedQuestIds`
   ist bereits in Reihenfolge gespeichert, und `Synapse` in `SynapseGraph.tsx` zeichnet Kanten beim
   Einhängen schon mit 650 ms Animation. Am Vorführ-iPhone mit vorbereitetem Spielstand sieht jede
   Person in fünf Sekunden den ganzen Spaziergang, den im Raum niemand gehen kann.
2. **Was die KI gesagt hätte** (Orchestrator) · 45–60 min, davon 20 Schreibarbeit. Je Ort ein vorab
   erzeugter, selbstbewusst falscher KI-Satz („etwa 18 Meter hoch") unter den echten Kennzahlen aus
   Kataster und Festivaldaten. Die These der App steht Satz gegen Satz auf dem Bildschirm. Braucht ein
   `AI_GUESS`-Dict neben `INFO` in `build_quests.py`, ein Feld, eine Fläche im Sheet. Die Sätze kann
   die zweite Person schreiben, während die erste das Replay baut.
3. **Synapse-Live-Draw beim Stempel** (Produkt) · 45–60 min. Die neue Kante zeichnet sich nach dem
   Stempel auf der Sheet-Karte. Hübsch, aber die Vorschau ist auf den Ort gezoomt, der Partner liegt
   außerhalb; das Sheet listet die neuen Synapsen schon. Zu wenig Zugewinn für die Zeit.

Umgestuft auf GROSS, weil Pipeline oder neues Feld nötig: Künstler-Weltkarte (Publikum),
Performance-Countdown (Publikum), Heimatland-Echo (Daten), Essbare Hecken am Weg (Daten).

## Rangliste GROSS

1. **Kompassnadel zur nächsten Datenbrücke** (Orchestrator + Produkt, zusammengeführt) · 60–90 min.
   Im Sheet-Kopf eines unentdeckten Orts eine Nadel, die sich mit dem Gerät dreht; Ziel bevorzugt das
   fehlende Ende einer halb entdeckten Datenbrücke. Der einzige Vorschlag, der im Raum selbst wirkt:
   drehen, Nadel schwenkt. Risiko: Heading nur am Gerät prüfbar, Rauschen, Sensor-Abo sauber lösen.
2. **Wer stellt aus, wer reist an** (Orchestrator; deckt Weltkarte, Herkunfts-Synapsen und
   Heimatland-Echo ab) · 100–120 min. Je Spielort die Länder der Künstler:innen als Kästchenreihe,
   gefüllt, wenn aus dem Land laut Tourismusstatistik Gäste kamen. Sauberster Join im ganzen
   Datensatz (`contacts.Country` × `herkunftslaender-gaeste.iso2`), aber nur vier Orte und ein
   ruhiges Bild. Die Fassungen der Ideengeber behaupteten „Gäste aus X waren hier" — das gibt die
   Statistik nicht her.
3. **Kategorie-Tanz im Netz** (Produkt) · ~110 min. Bewegung ohne neue Verschränkung, Performance-Risiko.
4. **NS-Straßenumbenennungen am Ort** (Daten) · 80–100 min. Thematisch am dichtesten an
   NEGOTIATING HUMANITY, aber ungeprüft, welche Quest-Straßen betroffen sind, nur Adress-Text-Join,
   und ein Lesemoment, kein Tu-Moment.

## Verworfen

- **Performance-Countdown** (Publikum): nur Festivaldaten, streift „Festivalkalender".
- **Liter-Haptik-Puls beim Scrollen** (Produkt): Politur, keine Verschränkung, nervt beim Wischen.
- **Baumring × Künstler-Diversität** (Daten): räumliche Nähe von Bäumen sagt nichts über Herkunft.
- **Hecken × Projekte per Textsuche** (Publikum) und **Hecken am Weg** (Daten): unscharf bzw. Umkreissuche.

## Empfehlung

Bis 13:00 **Netz-Replay** bauen, parallel die 23 KI-Sätze schreiben und, wenn vor 12:45 fertig,
die Fläche dazu. Den Freeze bricht allein die **Kompassnadel** wert, und nur, wenn Release-Build
und Gerätetest des Foto-Flows vorher stehen und die Nadel hinter einem Schalter liegt.

Pitch-Sätze: „Das ist der Spaziergang von gestern: in fünf Sekunden wächst das Netz, das keine KI
für dich gehen kann." — „Die KI sagt, die Platane im Stadtpark ist 18 Meter hoch. Der Kataster
sagt 25. Wir sind hingegangen."

## Gebaut (Stand 12:30)

Leo und Manuel haben entschieden, alle drei zu bauen. Netz-Replay, „Was eine KI gesagt hätte" und
Kompassnadel sind vor 13:00 im Code, `tsc` und `expo export` laufen durch. Gerätetest offen, siehe
`tasks/todo.md`.
