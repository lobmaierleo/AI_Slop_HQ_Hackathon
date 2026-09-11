# Lessons

Korrekturen und Muster, die sich wiederholen sollen. Nach jeder Korrektur ergänzen.

## 3.9.2026 — Vorbereitung

- **Erst prüfen, was die Veranstalter schon liefern.** Das offizielle Repo
  `BenjaminDerProgrammierer/ars-26-hackathon` enthielt bereits alle Linzer Datensätze aufbereitet,
  vier Agent-Skills und vier Beispielprojekte. Eine eigene Download-Pipeline zu bauen wäre
  verschwendete Arbeit gewesen.
- **Beispielprojekte der Veranstalter sind die Landkarte der verbrannten Ideen.** Sie zeigen, was
  die Mehrheit bauen wird — und damit, wo keine Originalitätspunkte zu holen sind.
- **Bei `npx skills add` heißt der Agent `claude-code`, nicht `claude`.** Mehrere Agents über
  wiederholtes `--agent` angeben; die Skills landen in `.agents/skills/` und funktionieren universal.

## 3.9.2026 — Vercel

- **Bei einem Unterordner-Projekt muss das Root Directory gesetzt sein, sonst scheitert jeder
  Push-Deploy.** `npx vercel --prod` aus `app/` heraus lud nur diesen Ordner hoch und lief durch;
  der erste automatische Deploy aus einem Git-Push baute dagegen vom Repo-Root und brach ab
  (`app/app/layout.tsx … does not satisfy the constraint '"/app"'`). Die CLI kann das Root
  Directory nicht setzen — nur das Dashboard oder ein `PATCH /v9/projects/<id>` mit
  `{"rootDirectory":"app"}`.
- **Ein erfolgreicher CLI-Deploy beweist nicht, dass der Git-Deploy funktioniert.** Es sind zwei
  verschiedene Pfade. Beide einzeln prüfen — vor dem Hackathon, nicht währenddessen.

## 9.9.2026 — Design-System und Karte

- **`DESIGN.md` ist ab sofort verbindlich für jede UI-Arbeit** und in `CLAUDE.md` als vierte
  Grundregel verankert. Die Tokens leben in `app/app/globals.css` als Tailwind-Theme; niemals
  Hex-Werte oder Pixelmaße inline schreiben.
- **Ein Fehler in der Kartenkomponente riss die ganze Seite ab.** Ohne WebGL2 wirft MapLibre beim
  Konstruieren eine Exception; unbehandelt nimmt sie den kompletten React-Baum mit, und der
  Besucher sieht statt der Zahlen nur noch „This page couldn't load". Jetzt in `try/catch` mit
  Fallback-Hinweis. Beim Community Voting kommen fremde Geräte auf die Seite — eine einzelne
  Komponente darf nie die Seite mitnehmen.
- **Headless Chrome für Screenshots braucht ein eigenes `--user-data-dir`**, sonst kollidiert es
  mit der laufenden Chrome-Instanz und hängt. Und ohne WebGL rendert MapLibre dort ohnehin nicht —
  für Kartenprüfungen führt kein Weg am echten Browser vorbei.

## 2026-09-11 — Leerer Screen nach „Neu starten" (expo-router Routen-Kollision)

**Symptom:** Nach Reset blieb nur die Tab-Bar sichtbar, der Inhalt war leer.
`router.replace('/')` bewirkte nichts.

**Ursache:** `app/index.tsx` und `app/(tabs)/index.tsx` lagen beide auf dem Pfad `/` —
eine Gruppe `(tabs)` fügt kein Pfadsegment hinzu. Der Beweis aus der laufenden App:

```
store.linking.getStateFromPath('/')
→ {"routes":[{"name":"__root","state":{"routes":[
   {"name":"(tabs)","state":{"routes":[{"name":"index","path":"/"}]}}]}}]}
```

`/` löste also auf den Tab-Screen auf, nicht auf die Team-Auswahl. Der Redirect
ersetzte den Screen durch sich selbst; ohne Team rendert er `null` → leere Fläche.
Die Team-Auswahl war beim Kaltstart nur deshalb sichtbar, weil der Root-Stack seine
Initial-Route **über den Namen** wählt, nicht über den Pfad.

**Regel:** In expo-router darf es pro Pfad genau eine Datei geben. Eine Gruppe mit
`index.tsx` neben einem `app/index.tsx` ist immer eine Kollision — der Tab-Start-Screen
bekommt einen eigenen Namen (`overview.tsx`).

**Methodik, die funktioniert hat:** Statt zu raten, im Simulator instrumentieren und
`xcrun simctl io booted screenshot` lesen. Reload ohne Tastatur:
`curl http://localhost:8081/reload`, Navigation testen mit
`xcrun simctl openurl booted "aisloppy:///overview"`.
