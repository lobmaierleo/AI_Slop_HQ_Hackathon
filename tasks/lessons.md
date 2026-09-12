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

## 2026-09-11 — Abgeschnittene Button-Beschriftungen (BrutSurface-Polster vs. feste Höhe)

**Symptom:** Bei „Vor Ort bestätigen", „Eigenes Netz aktivieren" und weiteren gelben
Knöpfen war der Text horizontal in der Mitte abgeschnitten — oben und unten fehlte je
ein Streifen der Schrift.

**Ursache:** `BrutSurface` polstert ihre Karte fest mit `padding: THEME.spacing.md`
(16px). Die Aufrufstellen setzten in `contentStyle` eine feste `height: 50`. Da
`contentStyle` nur `height` überschreibt und das vertikale Polster stehen lässt, bleibt
für den Inhalt `50 − 2 × 16 = 18px` — bei `THEME.type.bodyStrong` mit Zeilenhöhe 25.
Der Text wurde also nicht umbrochen, sondern beschnitten. Dasselbe Muster lag an acht
Stellen wortgleich im Code.

**Regel:** Nie eine feste `height` in eine `contentStyle` von `BrutSurface` schreiben.
Wo Mindesthöhe nötig ist: `minHeight` plus eigenes `paddingVertical`. Alle Knöpfe gehen
ab jetzt durch `app/components/BrutButton.tsx`, das genau das kapselt — das Muster
„HapticButton + BrutSurface + Text" nicht mehr von Hand nachbauen.

**Verallgemeinerung:** Ein Wrapper mit eigenem Polster und eine feste Außenhöhe an der
Aufrufstelle sind grundsätzlich ein Widerspruch. Achtmal dasselbe Muster im Code war
der eigentliche Befund — nicht acht Einzelfehler, sondern eine fehlende Komponente.

## Stiller Fehlerzweig wirkt wie ein toter Knopf (12.09.2026)

**Symptom:** Im Quest-Subfenster reagierte „Foto machen" scheinbar gar nicht, der
Auslöser erst nach vielen Versuchen, und „Ohne Foto bestätigen" schien wirkungslos.

**Ursachen — drei, alle derselben Art:**

1. `takePictureAsync` wirft, solange die Kamera nicht fertig initialisiert ist. Es gab
   keinen `onCameraReady`-Zustand, und der `catch`-Zweig schloss die Kamera. Jeder zu
   frühe Tipp warf den Benutzer also an den Anfang zurück — bis das Gerät zufällig
   schnell genug war. Das erklärt „funktioniert nach dem zehnten Mal" exakt.
2. `captureFailed` wurde an drei Stellen gesetzt und **nirgends gerendert**. Jeder
   Fehlschlag — auch eine abgelehnte Berechtigung — endete in vollkommener Stille.
3. `completePhotoQuest()` ohne Foto ließ den ganzen Beweis-Abschnitt verschwinden
   (`photoUri` undefiniert → `null`), statt zu bestätigen. Wirkung ohne Rückmeldung
   ist von Wirkungslosigkeit nicht zu unterscheiden.

**Regel:** Ein Fehlerzustand, der gesetzt aber nicht gerendert wird, ist kein
Fehlerzustand, sondern ein Bug. Jeder `catch` und jeder Ablehnungspfad braucht einen
sichtbaren Satz. Und: ein fehlgeschlagener Versuch darf nie den Zustand zurücksetzen,
den der Benutzer für den nächsten Versuch braucht.

**Verallgemeinerung:** `tsc` und `expo export` beweisen Typen und Auflösbarkeit, nie
Verhalten. Alles, was asynchron ist — Berechtigungen, Hardware-Initialisierung,
Aufnahme — ist ohne Gerät unbelegt. Solche Pfade beim Schreiben mit sichtbarer
Rückmeldung ausstatten, statt auf den Gerätetest zu hoffen.

**Zweite Lehre aus derselben Meldung:** `HapticButton` legt das übergebene `style` auf
die **innere** `Animated.View`, nicht auf das `Pressable`. `alignSelf: 'flex-start'`
dort macht den sichtbaren Knopf schmal, während die Trefferfläche über die volle Breite
liegt — sichtbarer Knopf und Trefferfläche gehen auseinander. Layout-Ausrichtung gehört
an die Aufrufstelle um den Knopf herum, nicht in seine `style`-Prop.

## `transform: undefined` stürzt den Dev-Build ab

`[TypeError: Cannot read property 'forEach' of null]` beim Loslassen einer Karte,
gemeldet an `BrutSurface.tsx:80`.

Ursache liegt in der Fabric-Prop-Diffung, nicht bei uns sichtbar:
`ReactNativeAttributePayload.diffProperties` macht aus einem `undefined` gewordenen
Style-Wert erst `null` und ruft dann `attributeConfig.process(null)` —
für `transform` also `processTransform(null)`. Das ruft unter `__DEV__`
`_validateTransforms(null)` → `null.forEach`. Nur im Debug-Build; im Release gäbe
`processTransform` still `null` zurück.

`BrutSurface` schaltete `transform` zwischen einem Array (gedrückt) und `undefined`
(Ruhe) um — genau dieser Übergang. Ausgelöst hat ihn jeder Tipp auf eine Quest-Kachel.

**Regel:** Eine Style-Eigenschaft mit eigenem `process` — `transform`,
`transformOrigin`, `fontVariant`, `aspectRatio`, `shadowOffset` — nie zwischen Wert und
`undefined` umschalten. Immer dieselbe Form ausliefern und stattdessen die Zahlen
variieren: `transform: [{ translateX: pressed ? offset : 0 }]`.
