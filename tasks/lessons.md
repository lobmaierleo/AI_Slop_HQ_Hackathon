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

## Ein Sheet, das `null` rendert, hält trotzdem alle seine Ressourcen

Nach dem Einbau von Standort und Kamera ins `QuestDetailSheet` kamen drei Fehler auf einmal:
die Karte ließ sich nicht mehr zoomen, ein Tipp im Netz öffnete kein Sheet, und die Kamera
warf `Cannot read property 'granted' of undefined`.

Gemeinsame Ursache: Das Sheet hängt in drei Screens und gibt bei `quest === null` früh `null`
zurück — **die Hooks darüber laufen trotzdem**. Damit liefen fünf `watchPositionAsync` und drei
`useCameraPermissions` parallel. iOS beantwortet immer nur eine Berechtigungsanfrage zur Zeit;
die übrigen lösen leer auf, deshalb war `result` in `requestPermission()` `undefined`. Und jedes
Standort-Update rendert den Screen samt `MapView` neu, was auf iOS die laufende Pinch-Geste
abbricht.

**Regeln:**
1. Ein Overlay, das Berechtigungen oder Sensoren hält, wird an der Aufrufstelle bedingt
   eingehängt (`{open ? <Sheet/> : null}`), nicht komponentenintern weggerendert.
2. Eine Ressource, die mehrere Bildschirme brauchen, gehört in einen Provider — einmal
   abonnieren, alle lesen. Nicht ein Hook, der pro Aufruf einen eigenen Watcher aufmacht.
3. Was sich häufig ändert, holt sich seinen Wert selbst. Die Nähe-Leiste ist eine eigene
   Komponente, damit ein Standortwechsel die Karte darüber nicht anfasst.
4. Ergebnisse von `requestPermission()` immer optional behandeln (`result?.granted`) und den
   Aufruf abfangen — sonst ist eine unbehandelte Promise-Rejection der Dank.

## 12.9.2026 — Kamerafreigabe und Kartenzoom, zweiter Anlauf

**Der Systemdialog erscheint nur einmal pro Installation.** `useCameraPermissions()` gibt einen
Status je Komponenteninstanz zurück; wer daraus `requestPermission()` aufruft, ohne vorher
`canAskAgain` zu prüfen, bekommt nach einer einmaligen Ablehnung weder Dialog noch Fehler — der
Knopf wirkt tot. Regel: Status immer frisch beim Modul holen (`Camera.getCameraPermissionsAsync`),
nur bei `canAskAgain` fragen, und bei `canAskAgain === false` einen Weg in die Einstellungen
anbieten (`openSettings()` aus `expo-linking`). Info.plist und natives Framework vorher prüfen —
in der gebauten `.app` unter `DerivedData`, nicht in der Quelle.

**Native Views gehören hinter `memo`.** Der Kartenschirm rendert bei jedem Sheet, jedem
Store-Update und jedem Standortwechsel; jeder dieser Renders reicht neue Marker-Kinder an die
`MapView` und bricht auf iOS die laufende Pinch-Geste ab. Eine Komponente nur für die Karte, mit
`memo` und stabilen Rückrufen via `useCallback`, lässt nur noch durch, was die Karte wirklich
verändert: Filter und Entdeckungsstand.

## 12.9.2026 — „Kamera fragt nie", „Karte nicht zoombar": es war der Paketstand, nicht der Code

**Symptom:** Am zweiten Rechner kam auf dem iPhone nie der Kameradialog, und die Karte liess sich
nicht zoomen — obwohl der Code beide Fehler laut `lessons.md` schon zweimal behoben hatte.

**Ursache:** `expo-camera` kam um 09:52 in die `package.json`, die `node_modules` auf dem zweiten
Rechner stammten vom Vortag. `npx tsc --noEmit` meldete nur `Cannot find module 'expo-camera'`, und
Metro haette den aktuellen Stand gar nicht buendeln koennen. Was auf dem Telefon lief, war das
Bundle vom Vortag — mit genau den zwei Fehlern, die inzwischen behoben waren.

**Regel:** Nach jedem `git pull` zuerst `cd app && npm install && npx tsc --noEmit`. Ein Fehlerbild,
das „schon behoben" ist, ist zuerst ein Verdacht auf einen alten Build, nicht auf den Code.
Metro danach einmal mit `npx expo start --clear` starten, sonst liefert der Cache das alte Bundle.

**Zweite Lehre:** `await Modul.funktion().catch(...)` faengt nur die Promise. Ist `Modul` selbst
`undefined`, wirft der Aufruf synchron, die `async`-Funktion lehnt ab, und der Knopf schweigt.
Deshalb steht in `handleOpenCamera` jetzt ein `try/catch` um den ganzen Ablauf, mit sichtbarem Satz.
