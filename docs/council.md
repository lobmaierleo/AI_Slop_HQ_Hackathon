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
