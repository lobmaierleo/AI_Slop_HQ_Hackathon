# SPEC: AI SLOPPY — The Great Linz Compute & Cooling Crisis

> **Typ:** Demo-Spezifikation für den AI Hackathon @ Ars Electronica Festival 2026  
> **Ziel:** Voll funktionsfähige, bühnenreife Demo-Anwendung für den 2-Minuten-Pitch & Community-Voting.  
> **Motto:** *Future Begins / NEGOTIATING HUMANITY*  
> **Design-Vorgabe:** Verbindliche Einhaltung von `DESIGN.md` (Apple-Ästhetik, Action Blue, keine Drop Shadows auf Chrome, randlose Wechseltiles, Typografie 17px/1.47, Gewichte 300/400/600/700).

---

## 1. Executive Summary & Narrativ

Während die Tech-Konzerne um „AGI“ rennen, verbrauchen Rechenzentren astronomische Mengen Grundwasser, während das Internet im selbst erzeugten Müll (*Model Collapse*) versinkt.

**AI Sloppy** ist eine bitterböse, interaktive Satire auf das globale KI-Wettrüsten. Der Spieler schließt sich einem von vier Big-Tech-Labs an und versucht, sein Modell als Erstes zur „AGI“ zu trainieren. Nach dem Motto **„Quantity over Quality“** muss das Modell mit möglichst viel synthetischem Unsinn („Slop“) gefüttert werden. Jede generierte Trainingseinheit entzieht jedoch den realen **Linzer Trinkbrunnen** live das Kühlwasser, während der Kontext kippt und historische Linzer Persönlichkeiten mit Festival-Kunstprojekten zu absurden Halluzinationen verschmelzen.

---

## 2. Die 4 spielbaren Fraktionen (Labs)

Jedes Team verkörpert eine reale Facette moderner KI-Pathologien:

| Lab | Slogan | UI-Tonalität | Satirischer Malus / Mechanik |
|---|---|---|---|
| **ClosedAI** | *„Openness is unsafe. Trust our closed box.“* | Corporate, maximal arrogant | Verlangt gelegentlich „Enterprise Subscription“ für einfache Klicks |
| **Antithropic** | *„100% harmless. We refuse to answer, but consume water anyway.“* | Über-vorsichtig, Moralisierend | **Alignment Tax:** Sperrt sich zeitweise selbst („Aus Sicherheitsgründen pausiert“) |
| **Grek** | *„Maximum Truth, zero filter, pure unhinged slop.“* | Chaotisch, unzensiert | Höchste Halluzinationsrate, beschleunigter Model Collapse |
| **ShallowSeek** | *„100x cheaper because we just distill ClosedAI.“* | Billig-Klon, Rechen-Effizienz | Kopiert die Slop-Daten der anderen Teams mit 50% Rabatt |

---

## 3. Struktureller Daten-Join (Festival ↔ Linz Open Data)

Gemäß Hackathon-Regel 2 müssen die Datensätze kausal und strukturell verknüpft sein:

### A. Festival-Projekte & Locations ↔ Linzer Trinkbrunnen
* **Dateien:** `data/festival/ars-festival-2026.json` (Projekte & 156 Locations) + `data/linz/trinkbrunnen/Trinkbrunnen.csv` (132 Brunnen mit Geo-Koordinaten).
* **Der Join:** Jede Festival-Location wird per Haversine-Distanz dem nächstgelegenen Linzer Trinkbrunnen zugewiesen.
* **Kausalität:** 
  - Jedes Training/Slop-Generieren an einem Festivalort saugt den zugeordneten Trinkbrunnen leer.
  - Formel: $1\text{ Slop-Token} = 0.008\text{ Liter Kühlwasser}$.
  - Ein Brunnen hat einen Puffer (z. B. $2.000\text{ Liter}$). Ist er bei $0\text{ l}$, gilt er als **„TROCKENGELEGT / KRITISCH“** und der lokale Festival-Knoten überhitzt.
* **Sekundär-Kompensation:** `data/linz/baumkataster/Baumkataster.csv` (27.004 Bäume).
  - Berechnung: „Um die Abwärme zu kompensieren, müssen $X$ Platanen am Linzer Hauptplatz gefällt werden.“

### B. Linzer Straßennamen ↔ Festival-Projektbeschreibungen
* **Dateien:** `data/linz/strassennamen/Strassennamen-aktuell.csv` (Persönlichkeiten: Kepler, Mozart, Stifter etc.) + `data/festival/ars-festival-2026.json` (`Description EN/DE`, `Artists`).
* **Der Join:** Synthetische Halluzinations-Engine.
  - Das System erzeugt Trainings-Quests („Synthetic Data Poisoning“), indem reale Biografien Linzer Persönlichkeiten mit Ars-Electronica-Themen (Bio-Art, Robotics, Post-Humanism) hybridisiert werden.
  - Beispiel: *„Johannes Kepler erfand 1618 nicht die Planetengesetze, sondern eine Post-Gender-Bio-Kybernetik-Performance im Deep Space 8K.“*

---

## 4. Technische Architektur

### A. Zero-Runtime-LLM (Stabilität vor Ort)
* **Keine externen API-Calls während der Demo.**
* Ein Vorberechnungs-Script (`scripts/generate_slop_data.py`) analysiert die Rohdaten und generiert eine statische JSON-Fixture:
  - `data/derived/slop_fixtures.json`: Vorberechnete Quests, Halluzinations-Paare, Brunnen-Zuordnungen und Team-Reaktionen.
  - 100% offline-fähig, immun gegen WLAN-Ausfälle in der Grand Garage.

### B. Frontend-Stack & Native Apple UI (Expo)
* **Framework:** React Native / Expo (mit React Native Web Unterstützung).
* **DESIGN IS KING:** Die visuelle und haptische Qualität der App ist für den Hackathon-Erfolg und das Community Voting entscheidend. Die App muss sich anfühlen wie eine erstklassige native Apple First-Party App (iOS Health / Fitness / Settings Ästhetik).
* **Verbindliche Apple UI Komponenten:**
  1. **Large Title Navigation:** Kollabierende iOS Large Titles (34px bold) mit sanftem Scroll-Verhalten.
  2. **Segmented Controls (`UISegmentedControl` Style):** Schwebende Kapsel-Tabs mit gleitendem Hintergrund für Ansichten (z. B. *Cockpit*, *Quests*, *Cooling Grid*).
  3. **Inset Grouped Lists:** iOS-typische gruppierte Listen mit abgerundeten Ecken (`rounded-2xl`), Kacheln und feinen Hairline-Trennlinien (`hairline: #e0e0e0` / `divider-soft`).
  4. **SF Symbols / Apple Icons:** Präzise, einheitliche Linienstärken passend zur Typografie.
  5. **iOS Modal Bottom Sheets (`pageSheet`):** Quests, Brunnen-Details und Warnungen gleiten als native Sheets mit Grabber-Leiste von unten hinein.
  6. **Haptics (`expo-haptics`):** Spürbares taktiles Feedback beim Drücken von Buttons (`impactAsync`), Slop-Pumpen und haptische Warnung (`notificationAsync(Warning)`), sobald ein Linzer Brunnen austrocknet.
  7. **Frosted Glass & Blur (`expo-blur`):** Echte iOS Blur-Effekte für fixierte Navigation- und Tab-Bars.
  8. **Feder-Physik (Spring Animations):** Flüssige Übergänge mit Apple-typischem Bounce/Spring statt linearer Web-Animationen.

---

## 5. Screen & Feature Spezifikation

Die App gliedert sich in 3 Kern-Views:

```
+-------------------------------------------------------------+
|                        APP FLOW                             |
|                                                             |
|  [ 1. Team Onboarding ]  -->  [ 2. Main Slop Cockpit ]      |
|  (Wähle dein AI Lab)          - Live Telemetrie             |
|                               - Trinkbrunnen-Status         |
|                               - Quest Hub (Slop füttern)    |
|                                         |                   |
|                                         v                   |
|                               [ 3. Global Race View ]       |
|                               - AGI Race Leaderboard        |
|                               - Linzer Brunnen-Map / Liste  |
|                               - Demo Presentation Mode      |
+-------------------------------------------------------------+
```

### Screen 1: Lab Onboarding
* **Inhalt:** Auswahl des AI-Labs (`ClosedAI`, `Antithropic`, `Grek`, `ShallowSeek`).
* **UI:** 4 randlose Kacheln (`surface-tile-1` / `canvas-parchment`), Lab-Slogan, Akzent-Badge.
* **Aktion:** Antippen wählt das Team und leitet sofort ins Cockpit weiter.

### Screen 2: Main Slop Cockpit (Die Trainings-Schleife)
1. **Live-Telemetrie (Hero-Bereich):**
   * **AGI Progress:** Prozentbalken (z. B. 84.3% bis zur Weltherrschaft).
   * **Slop Tokens:** Zähler (z. B. `14.2 M Tokens gefüttert`).
   * **Linzer Wasserverbrauch:** Große Metrik (`2.418 Liter verdampft`).
   * **Aktiver Brunnen:** Name des lokalen Linzer Brunnens (z. B. *„Trinkbrunnen Hauptplatz #104 – Füllstand: 12%“*).
2. **Quest Hub („Füttere das Modell“):**
   * **Mini-Game A: „Slop or Real Art?“**
     Zwei Statements werden angezeigt (Echtes Festival-Projekt vs. halluzinierter Linzer Geschichts-Slop). Der User wählt den Slop. 
     *Belohnung:* „+250k Tokens Slop! Datenqualität sinkt um 3.2% – Perfekt!“
   * **Mini-Game B: „Compute Overdrive / Slop Pump“**
     Ein Button zum schnellen Hämmern (*„Compute boosten“*). Jeder Tap zieht Wasser ab, erzeugt sinnlosen synthetischen Code/Text und treibt den Zähler hoch.
   * **Mini-Game C: „Multimodal Scanner“**
     Kamera-Attrappe oder Bildauswahl: Erkennt jedes Objekt als *„Kritische Trainingsdaten für AGI“*.
3. **Kontext-Kollaps / Halluzinationseffekte:**
   * Ab 70% Slop-Level beginnt das Interface satirisch zu zerfallen:
     - Texte vertauschen Wörter mit Linzer Straßennamen.
     - Antithropic blendet Popups ein: *„Achtung: Dieser Gedanke wurde aus Sicherheitsgründen zensiert.“*
     - Wasserzähler springt auf Rot: *„Brunnen Pfarrplatz trocken. Kühlung schlägt fehl!“*

### Screen 3: Global Leaderboard & Linz Cooling Grid (Bühnen-View)
* **Team-Ranking:** Live-Fortschritt der 4 Labs Richtung 100% AGI.
* **Brunnen-Friedhof:** Liste der bereits „ausgetrockneten“ Linzer Trinkbrunnen, geordnet nach zerstörter Wassermenge.
* **Baum-Äquivalent:** *„Bereits vernichtete CO2-Kompensation: 342 Linzer Stadtbäume.“*
* **Demo-Controls (Unten dezent oder versteckt):**
  - Toggle: *Auto-Simulate Live Traffic* (Zahlen steigen kontinuierlich an).
  - Button: *Trigger Model Collapse* (Löst sofort visuelle Glitches und Brunnen-Alarm aus).
  - Button: *Reset Race*.

---

## 6. Daten-Pipeline Script (`scripts/generate_slop_data.py`)

Das Skript muss deterministisch und offline ausführbar sein:
1. Lädt `data/festival/ars-festival-2026.json`.
2. Lädt `data/linz/trinkbrunnen/Trinkbrunnen.csv`.
3. Lädt `data/linz/strassennamen/Strassennamen-aktuell.csv`.
4. Berechnet Distanzmatrix: `Festival-Location` $\rightarrow$ nächster `Trinkbrunnen`.
5. Erzeugt 40–50 witzige, vorberechnete Quests (Mischung aus realen Festivaltexten und absurden Straßennamen-Halluzinationen).
6. Schreibt `data/derived/slop_fixtures.json`.

---

## 7. Design & UI Guidelines Checkliste (aus `DESIGN.md` & Apple HIG)

- [ ] **Design ist Prio 1:** Die UI muss wie eine native Apple First-Party iOS App wirken (kein generischer Web-Look, kein AI-Standard-Template).
- [ ] **Akzentfarbe:** Einzig und allein Action Blue (`#0066cc` / `#0071E3` / Tailwind `primary`). Keine bunten Teamfarben für UI-Elemente; Teams unterscheiden sich durch Typografie, Badges und monochrome Graustufen (`POINT_TONE`).
- [ ] **Apple UI Komponenten:** Inset Grouped Lists (`style: .insetGrouped`), Segmented Controls, Large Titles, Frosted Blur Navigation-Bar (`expo-blur`), native Modal Sheets (`pageSheet`).
- [ ] **Flächen & Kontraste:** Randlose Kacheln im Wechsel (`bg-canvas` $\rightarrow$ `bg-surface-tile-1` $\rightarrow$ `bg-canvas-parchment`).
- [ ] **Keine Schatten auf Chrome:** Absolut keine Drop-Shadows auf Cards, Buttons oder Badges. Tiefe entsteht ausschließlich durch Hell/Dunkel-Flächenwechsel.
- [ ] **Typografie:** SF Pro Text / SF Pro Display. Fließtext exakt 17px / Zeilenhöhe 1.47. Überschriften mit leicht negativer Laufweite (`tracking-tight`).
- [ ] **Kein Font-Weight 500:** Streng verboten. Ausschließlich 300, 400, 600, 700 verwenden.
- [ ] **Haptik & Micro-Interactions:** `expo-haptics` bei jedem relevanten Tap; `transform: scale(0.95)` Button-Druckzustand. Fluid Spring Physics.

---

## 8. Abnahmekriterien für die fertige Demo

1. **Startbereit in 5 Sekunden:** App lädt sofort im Simulator oder Browser, zeigt das Lab-Onboarding.
2. **Klarer 60-Sekunden-Fun:** Man versteht in 15 Sekunden das Prinzip (Team wählen $\rightarrow$ Slop pumpen $\rightarrow$ Linzer Trinkbrunnen leersaugen $\rightarrow$ Leaderboard steigt).
3. **Daten-Verschränkung klar sichtbar:** In jedem Screen ist der Bezug zwischen echtem Festivalprojekt und echtem Linzer Brunnen / Straßennamen präsent.
4. **Bühnentauglicher Demo-Modus:** Durch Auto-Simulation steigen die Zahlen während des Pitches dynamisch, ohne manuelle Klick-Hektik.
