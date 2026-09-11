# IMPLEMENTATION SPEC: AI SLOPPY — Linz Explorer & AGI Quest

> **Status:** VERBINDLICHE IMPLEMENTIERUNGS-SPEZIFIKATION FÜR CLAUDE CODE  
> **Ziel:** Eine ultra-cleane, spielerische, visuell atemberaubende Mobile-App (Expo / React Native).  
> **Mission:** Linz spielerisch erlebbar machen – verpackt in eine charmante KI-Trainingsmission.  
> **Leitmotiv:** **Orange Bright, Apple Liquid Glass, radikal wenig Text, 100% intuitive 2-Tab-Navigation.**

---

## 1. Warum die vorherige Version gescheitert ist (VERBOTENE MUSTER)

❌ **STRENG VERBOTEN:**
- **Keine Textwüsten:** Keine langen Absätze, keine philosophischen Abhandlungen, keine komplizierten Readout-Listen.
- **Keine verschachtelte Navigation:** Keine Sub-Pages (`fountain/[id]`, `regie`, `pane-switcher`, Burger-Menüs).
- **Kein düsteres "Terminal- / FinTech-Cockpit":** Nicht grau-in-grau, keine 10 kleinen Daten-Kästchen nebeneinander.
- **Keine komplizierte State-Engine:** Kein Over-Engineering mit komplexen Simulations-Ticks oder NS-Wortfiltern.

✅ **DAS MUSS GEBAUT WERDEN:**
- **Bunt, verspielt, vibrant:** Knalliges Orange (`#FF5C00`), weiche Kacheln (`borderRadius: 28`), große Touch-Targets.
- **Apple Liquid Glass Navigation:** Schwebende, pillenförmige Frosted-Glass-Tab-Bar unten mit `expo-blur`.
- **Exakt 2 Tabs:** Nur `[ Übersicht ]` und `[ Quests ]`.
- **Echte Linzer Open Data:** Trinkbrunnen & Bäume sind das Herzstück der Quests.
- **Instant Haptic Fun:** Jeder Klick fühlt sich durch `expo-haptics` und sanfte Feder-Skalierung (`scale: 0.96`) befriedigend an.

---

## 2. Exakte Dateistruktur im Projekt (`app/`)

Claude soll exakt diese modulare und überschaubare Struktur implementieren:

```
app/
├── app/
│   ├── _layout.tsx              # Root Layout (Fonts, Safe Area, State Provider)
│   ├── index.tsx                # Screen 1: Visuelles Onboarding (Team-Wahl)
│   └── (tabs)/
│       ├── _layout.tsx          # Floating Liquid Glass Tab Bar (expo-blur)
│       ├── index.tsx            # TAB 1: Übersicht (Dashboard)
│       └── quests.tsx           # TAB 2: Quests (Foto-Mission & Fakt oder Slop)
├── components/
│   ├── LiquidTabBar.tsx         # Schwebende Frosted-Glass Tab Bar
│   ├── HapticButton.tsx         # Bouncy Touch-Button mit expo-haptics & scale(0.96)
│   ├── StatCard.tsx             # Verspielte Metrik-Karte mit Icon & Riesen-Zahl
│   ├── PhotoQuestCard.tsx       # Foto-Mission Karte (Kamera-Trigger + Laser-Scan)
│   └── FactOrSlopCard.tsx       # Fakt-oder-Slop Quiz-Karte ([ Fakt ] vs [ Slop ])
├── data/
│   └── quests.json              # Schlankes JSON mit echten Linz-Quests & Trivia
└── state/
    └── useGameStore.ts          # Zustand oder React Context (Team, Wasserverbrauch, Quests)
```

---

## 3. Design System & Style Tokens

Claude muss sich strikt an diese Werte halten:

```typescript
export const THEME = {
  colors: {
    primary: '#FF5C00',          // Electric Orange Bright (Signature Accent)
    primaryLight: '#FFF0E6',     // Weicher oranger Tint für Badges/Highlights
    success: '#00C853',          // Fresh Mint Green (für Fakt / Erledigt)
    error: '#FF3D00',            // Punch Coral/Red (für Slop / Warnung)
    background: '#F8F8FA',       // Heller, cleaner Canvas
    card: '#FFFFFF',             // Weiße Kacheln
    glassBackground: 'rgba(255, 255, 255, 0.75)', // Liquid Glass Base
    glassBorder: 'rgba(255, 255, 255, 0.4)',      // Glass Highlight
    text: '#1A1A1E',             // Satt-dunkle Typo
    textMuted: '#8E8E93',        // Sekundär-Text
    hairline: 'rgba(0, 0, 0, 0.06)',
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    pill: 9999,
  },
};
```

---

## 4. Screen-Spezifikation im Detail

### 1. Screen: Visuelles Onboarding (`app/app/index.tsx`)
* **Wann sichtbar:** Wenn noch kein Team gewählt wurde (`selectedTeam === null`).
* **Header:**
  * Subtitle: *„AI SLOPPY · ARS ELECTRONICA 2026“* (klein, orange, uppercase).
  * Title: *„Wähle dein KI-Lab.“* (34px, bold).
  * Intro: *„Trainiere die AGI mit echten Daten aus Linz. Koste es das gesamte Linzer Trinkwasser.“* (max. 1 Satz!).
* **Die 4 Team-Karten:**
  1. 🟧 **ClosedAI** — *„Openness ist überbewertet. Alles bleibt in unserer Blackbox.“*
  2. 🟪 **Antithropic** — *„100% harmlos. Beantwortet nichts, verbraucht trotzdem Kühlwasser.“*
  3. ⚡ **Grek** — *„Volles Chaos, null Zensur, maximale Halluzination.“*
  4. 🌀 **ShallowSeek** — *„Gleiche Power, 90% billiger, weil wir von den anderen kopieren.“*
* **Aktion:** Tap auf eine Kachel löst `Haptics.impactAsync()` aus, speichert das Team und navigiert sofort auf `/(tabs)/`.

---

### 2. Tab 1: Übersicht (`app/app/(tabs)/index.tsx`)

Muss aufgeräumt, positiv und motivierend sein:

1. **Team AGI-Hero Card (Oben):**
   * Zeigt gewähltes Team-Logo & Name.
   * **AGI-Fortschritt:** Schicker animierter Prozentbalken (z. B. `74.8% bis AGI`).
   * **Team-Rang:** Großes Badge: *„Platz 2 im Linzer Race“*.
2. **Dein persönlicher Impact (2 Stat-Cards nebeneinander):**
   * 💧 **Wasserverbrauch:** z. B. `48.2 L`  
     *Subtitle:* *„Linzer Donauwasser verdampft“*
   * ⚡ **Slop trainiert:** z. B. `14.200 kTokens`  
     *Subtitle:* *„Synthetische Daten gefüttert“*
3. **Linz Spot des Tages (Reale Linz Open Data):**
   * Wählt einen echten Linzer Trinkbrunnen oder Baum aus den Daten (z. B. *„Trinkbrunnen Pfarrplatz #104“*).
   * Kurzer Teaser: *„Server laufen heiß! Dieser Brunnen kühlt aktuell die Trainings-Cluster.“*
   * Button: `[ Zur Kühl-Mission springen → ]` (wechselt direkt auf Tab 2).

---

### 3. Tab 2: Quests (`app/app/(tabs)/quests.tsx`)

Oben befindet sich ein cleaner **Segmented Switcher** (Pill-Toggle):
`[ 📸 Foto-Missionen ]` | `[ ❓ Fakt oder Slop ]`

#### Bereich A: 📸 Foto-Missionen (Linz interaktiv erlebbar machen!)
* Jede Quest ist eine hübsche, weiße Kachel (`radius: 28`):
  * **Icon / Badge:** z. B. 🚰 *„Trinkbrunnen-Kühlung“* oder 🌳 *„CO2-Kompensation“*.
  * **Titel & Ort:** z. B. *„Hauptplatz Brunnen (#104)“* oder *„Platane im Donaupark“*.
  * **Auftrag:** *„Finde diesen Ort in Linz und liefere frische Kühlflüssigkeit für das Modell.“*
  * **Interaktion:** Button `[ 📷 Foto scannen ]`.
    * Öffnet Kamera oder Bild-Upload (oder einen sofortigen Test-Mock).
    * Nach Foto: Ein cooles 1-Sekunden-Overlay mit Scan-Linie:  
      *„Analysiere Linzer Trainingsdaten... 100% Kühlwasser verifiziert!“*
    * **Belohnung:** Konfetti / Erfolgs-Animation, `+500 Tokens`, `+3.4 Liter Wasser verbraucht`.

#### Bereich B: ❓ Fakt oder Slop? (Das schnelle Trivia-Game)
* Eine dominante Quiz-Karte mit Statement:
  * **Statement-Text:** (Groß, 20px, fett, gut lesbar).  
    *Beispiel 1:* *„Beim Festival 2026 gibt es ein Projekt namens 'Glitch & Leak: Overflowing Bodies'.“*
    *Beispiel 2:* *„Johannes Kepler erfand 1618 im Linzer Landhaus den ersten Prompt-Generator.“*
    *Beispiel 3:* *„Linz besitzt über 27.000 registrierte Stadtbäume im offiziellen Baumkataster.“*
  * **Die beiden Action-Buttons:**
    * Links: `[ ✅ ECHTER FAKT ]` (Grüner Glow / Mint-Farbe)
    * Rechts: `[ 🛑 AI SLOP ]` (Oranger Glow / Punch-Farbe)
  * **Instant-Feedback:**
    * Bei Richtig: Haptisches Doppel-Klopfen, Erfolgs-Banner (*„Richtig! Modell gefüttert.“*), nächstes Statement slidet hinein.
    * Bei Falsch: Glitch-Effekt (*„Falsch! Halluzination um 5% gestiegen.“*).

---

### 4. Apple Liquid Glass Tab Bar (`components/LiquidTabBar.tsx`)

* Schwebend, mit Abstand zum unteren Bildschirmrand (`bottom: 24`, `marginHorizontal: 24`).
* Höhe: ~64px, `borderRadius: 32`.
* `expo-blur` mit `tint="systemMaterialLight"` oder `intensity={80}`.
* Dezente Umrandung mit `borderColor: rgba(255, 255, 255, 0.4)` und feinem Schatten.
* Zwei Tabs mit klaren Icons (SF Symbols / Feather Icons) und Beschriftung:
  - 🏠 **Übersicht**
  - 🎯 **Quests**
* Aktiver Tab leuchtet in kräftigem `#FF5C00`.

---

## 5. Datenbasis für Quests (`data/quests.json`)

Damit die App sofort offline und unabhängig läuft, soll Claude eine handliche `quests.json` mit echten Linz-Daten anlegen:

```json
{
  "photoQuests": [
    {
      "id": "p1",
      "type": "water",
      "title": "Hauptplatz Brunnen",
      "location": "Hauptplatz 1, Linz",
      "desc": "Kühle die ClosedAI-Cluster mit Wasser aus dem historischen Brunnen.",
      "tokens": 800,
      "waterLiters": 6.4
    },
    {
      "id": "p2",
      "type": "tree",
      "title": "Donaupark Platane",
      "location": "Donaupark Linz (Baumkataster #4012)",
      "desc": "Kompensiere den Rechenzentren-Smog mit einer 18-Meter-Platane.",
      "tokens": 650,
      "waterLiters": 4.8
    },
    {
      "id": "p3",
      "type": "water",
      "title": "Pfarrplatz Brunnen",
      "location": "Pfarrplatz, Linz",
      "desc": "Notkühlung für überhitzte GPUs im OK-Viertel.",
      "tokens": 950,
      "waterLiters": 7.2
    }
  ],
  "triviaQuests": [
    {
      "id": "t1",
      "statement": "Beim Ars Electronica Festival 2026 gibt es eine Performance namens 'Glitch & Leak'.",
      "isFact": true,
      "explanation": "Tatsächlich ein echtes Highlight-Projekt aus dem Programmdatensatz!"
    },
    {
      "id": "t2",
      "statement": "Johannes Kepler programmierte 1618 im Linzer Landhaus den ersten Schachcomputer.",
      "isFact": false,
      "explanation": "Kompletter KI-Slop! Kepler berechnete Planetenbahnen, keine Algorithmen."
    },
    {
      "id": "t3",
      "statement": "Die Stadt Linz erfasst über 27.000 einzelne Bäume im digitalen Baumkataster.",
      "isFact": true,
      "explanation": "Offizielle Open-Data-Zahl: 27.004 Bäume sind exakt kartiert."
    },
    {
      "id": "t4",
      "statement": "Antithropic hat den Linzer Hauptplatz aus Sicherheitsgründen als verboten eingestuft.",
      "isFact": false,
      "explanation": "Satirischer Slop! Aber passend zur Alignment-Paranoia."
    }
  ]
}
```

---

## 6. Zustandsverwaltung (`state/useGameStore.ts`)

Ein simpler React Context oder Zustand-Store:
- `team`: string | null (z. B. `'ClosedAI'`)
- `waterLiters`: number (startet bei z. B. `24.5`, wächst mit jeder Quest)
- `slopTokens`: number (startet bei z. B. `8200`, wächst mit jeder Quest)
- `agiProgress`: number (z. B. `68%`, wächst kontinuierlich)
- `completedQuestIds`: string[]
- Actions:
  - `selectTeam(teamId)`
  - `completePhotoQuest(questId)`
  - `answerTrivia(questId, wasCorrect)`
  - `resetGame()`

---

## 7. Wichtige Qualitätskriterien für den Bau

1. **Kein Absturz bei Klicks:** Jede Aktion muss sofort visuelles und haptisches Feedback geben.
2. **Kamera/Upload-Fallback:** Der Foto-Scan muss auch ohne echte Hardware-Kamera (z. B. im Simulator oder Web) per Test-Knopf sofort funktionieren!
3. **Flüssige Animationen:** Klick-Skalierung auf allen Buttons.
4. **Schlichte Eleganz:** Weißer Hintergrund, strahlendes Orange, gläserne Leiste – maximal appetitlich und aufgeräumt.
