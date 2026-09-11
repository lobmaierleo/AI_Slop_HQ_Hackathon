# SPEC: AI SLOPPY — Linz Explorer & AGI Quest

> **Typ:** Finale Demo-Spezifikation für den AI Hackathon @ Ars Electronica Festival 2026  
> **Mission:** Linz interaktiv und spielerisch erlebbar machen – verpackt in eine charmante KI-Trainingsmission.  
> **Visual Direction:** **Orange Bright & Verspielt**. Keine sterile Corporate-AI-App. Apple Liquid Glass Navigation, organische abgerundete Formen (`rounded-3xl`), satte Haptik, klare Typografie und **radikal wenig Text**.

---

## 1. Das Kernprinzip (In 3 Sätzen)

1. **Die Story:** Die vier großen KI-Labs (*ClosedAI*, *Antithropic*, *Grek*, *ShallowSeek*) kämpfen um die Vorherrschaft („AGI“). Um dein Modell zu trainieren, musst du echte Trainingsdaten direkt aus Linz und dem Ars Electronica Festival beschaffen.
2. **Die Mechanik:** Du wählst dein Team und erfüllst zwei simple Quest-Typen: **Foto-Missionen** an echten Linzer Orten (Trinkbrunnen, Stadtbäume) und **„Fakt oder Slop?“**-Quests über Festival-Projekte und Linzer Mythen.
3. **Der Live-Twist:** Jede abgeschlossene Quest bringt dein Team im AGI-Rennen nach vorne – verbraucht aber virtuell echtes Linzer Trinkwasser zur Serverkühlung!

---

## 2. Design & Visual System (Orange Bright & Liquid Glass)

* **Design-Fokus:** Verspielt, einladend, hochenergetisch und extrem aufgeräumt. Niemals Textwüsten – Information wird visuell über Cards, Badges und Animationen transportiert.
* **Farbpalette:**
  * **Signature Accent:** `Bright Orange` (`#FF5C00` / `#FF6B00`) – warm, leuchtend, verspielt.
  * **Secondary Accents:** `Mint Cyan` (`#00D2A0` für Fakten/Erfolg), `Punch Coral` (`#FF3B30` für Slop/Fehler), `Electric Purple` (`#8A2BE2` für AGI-Status).
  * **Hintergründe:** Warmer Canvas (`#F8F8FA`) im Light Mode oder sattes Deep Charcoal (`#121214`) mit orangefarbenen Glows.
* **Apple Liquid Glass Navigation:**
  * Schwebende, pillenförmige Tab-Bar am unteren Bildschirmrand.
  * `expo-blur` (Translucent Frosted Glass mit `tint="systemMaterial"` oder `tint="light"`), feiner Rand (`rgba(255, 255, 255, 0.3)`), weiche Schatten und leuchtender Orange-Indikator für den aktiven Tab.
* **Haptik & Micro-Interactions:**
  * `expo-haptics` bei jedem Tab-Wechsel (`selectionAsync`), jedem Button-Druck (`impactAsync(Medium)`) und bei Quest-Erfolgen (`notificationAsync(Success)`).
  * Bouncy Spring Physics: Karten skalieren beim Berühren sanft ein (`scale: 0.96`).

---

## 3. Screen 1: Visuelles Onboarding (Team-Wahl)

* **Wann:** Nur beim allerersten Start der App (gespeichert in `AsyncStorage`).
* **Text:** Maximal 2 Sätze:  
  *„Trainiere die nächste Superintelligenz mit realen Daten aus Linz. Wähle dein Lab und starte die Jagd.“*
* **UI:** 4 große, farbenfrohe Kacheln mit verspieltem Logo & Kurz-Motto:
  1. 🟧 **ClosedAI** — *„Openness ist überbewertet.“*
  2. 🟪 **Antithropic** — *„100% sicher. Zu 0% hilfreich.“*
  3. ⚡ **Grek** — *„Volles Chaos, null Filter.“*
  4. 🌀 **ShallowSeek** — *„Gleiche Power, halber Preis.“*
* **Interaktion:** Antippen wählt das Team mit spürbarem Haptic-Feedback und springt sofort in die App.

---

## 4. Die 2 Kern-Tabs (Strikte 2-Tab-Navigation)

Es gibt **nur zwei Tabs** – keine versteckten Menüs, kein Labyrinth!

```
+-------------------------------------------------------+
|                       APP FLOW                        |
|                                                       |
|    [ Onboarding: Wähle 1 von 4 Teams ] (einmalig)    |
|                          |                            |
|         +----------------+----------------+           |
|         |                                 |           |
|         v                                 v           |
|   [ TAB 1: ÜBERSICHT ]            [ TAB 2: QUESTS ]   |
|   - Team-Status (AGI-Rennen)      - 📸 Foto-Mission   |
|   - Dein Wasserverbrauch          - ❓ Fakt oder Slop |
|   - Linz Hotspot Highlight                            |
|                                                       |
|   =================================================   |
|   [ 🏠 Übersicht ]         [ 🎯 Quests ] (Liquid Bar) |
+-------------------------------------------------------+
```

---

### Tab 1: Übersicht (Dashboard)

1. **Team Hero Card (Oben):**
   * Große, leuchtende Kachel in Team-Optik.
   * **Live AGI-Fortschritt:** Animierter Ring oder Fortschrittsbalken (z. B. *„ClosedAI: 74% zu AGI“*).
   * **Team-Rang:** *„Platz 2 im Linzer AI Race“*.
2. **Dein persönlicher Impact (Zwei verspielte KPI-Kacheln nebeneinander):**
   * 💧 **Wasserverbrauch:** *„48,2 Liter Linzer Trinkwasser zur Serverkühlung verdampft.“*
   * ⚡ **Slop Ingested:** *„14.200 kTokens Trainingsdaten generiert.“*
3. **Linz Hotspot des Tages (Unten):**
   * Eine Karte, die einen echten Linzer Ort vorstellt (aus `data/linz/trinkbrunnen` oder `data/linz/baumkataster`):
   * *„Trinkbrunnen am Pfarrplatz — Bereit für die nächste Kühl-Mission!“*
   * Button: *„Direkt dorthin & Quest starten →“* (wechselt zu Tab 2).

---

### Tab 2: Quests (Aufgaben-Hub)

Hier gibt es **genau 2 Quest-Typen**, die Linz interaktiv erlebbar machen:

#### Quest-Typ A: 📸 Foto-Missionen (Linz physisch erkunden)
* **Ziel:** Den Linzer Stadtraum entdecken und dem Modell visuelle „Trainingsdaten“ liefern.
* **Datenquelle:** `data/linz/trinkbrunnen/Trinkbrunnen.csv` & `data/linz/baumkataster/Baumkataster.csv`.
* **Beispiel-Aufgaben:**
  * 🚰 *„Finde den historischen Trinkbrunnen am Hauptplatz (#104) und kühle unsere Server!“*
  * 🌳 *„Finde eine Platane im Linzer Donaupark zur CO2-Kompensation des Modells!“*
  * 📡 *„Finde den Free-WLAN-Hotspot an der Donaupromenade für den Datacenter-Uplink!“*
* **Interaktion:**
  * Button *„Foto aufnehmen / scannen“* (Kamera oder Test-Fotoauswahl).
  * Spielerische Instant-Validierung: Lustiges Overlay scannt das Bild mit Laser-Animation $\rightarrow$ *„Perfekt! 100% zertifizierte Linzer Kühlflüssigkeit erkannt. +1.500 Tokens für dein Team!“*

#### Quest-Typ B: ❓ Fakt oder Slop? (Trivia & Fake-Detection)
* **Ziel:** Spielerisch lernen, wie sich echter Linzer Kultur-Content von halluziniertem KI-Slop unterscheidet.
* **Datenquelle:** `data/festival/ars-festival-2026.json` + `data/linz/strassennamen/Strassennamen-aktuell.csv`.
* **Spielablauf:**
  * Eine visuell herausstechende Karte zeigt ein kurzes Statement.
  * Der Spieler hat zwei große Buttons: `[ ✅ FAKT ]` oder `[ 🛑 AI SLOP ]`.
* **Beispiele (aus echten Daten generiert):**
  * *„Beim Festival 2026 gibt es ein Projekt namens 'Glitch & Leak: Overflowing Bodies in Public Space'.“*  
    $\rightarrow$ **FAKT** (Echtes Festivalprojekt!).
  * *„Johannes Kepler erfand 1618 im Linzer Landhaus das erste neuronale Netzwerk zur Weinlese.“*  
    $\rightarrow$ **SLOP** (Historischer Straßenname mit absurder KI-Halluzination).
  * *„Im Linzer Baumkataster sind über 27.000 einzelne Stadtbäume digital erfasst.“*  
    $\rightarrow$ **FAKT** (Reale Open-Data-Zahl).
* **Feedback:** Sofortiges haptisches Feedback, Konfetti bei Richtig, lustiger Glitch bei Falsch.

---

## 5. Daten-Pipeline Script (`scripts/generate_slop_data.py`)

Ein einfaches Python-Skript erzeugt alle Quests statisch im Vorfeld:
1. Lädt `data/linz/trinkbrunnen/Trinkbrunnen.csv` $\rightarrow$ generiert 15 Trinkbrunnen-Fotoquests mit echten Adressen/Namen.
2. Lädt `data/linz/baumkataster/Baumkataster.csv` $\rightarrow$ generiert 15 Baum-Fotoquests (Gattung, Ort).
3. Lädt `data/festival/ars-festival-2026.json` & `data/linz/strassennamen/Strassennamen-aktuell.csv` $\rightarrow$ generiert 25 knackige „Fakt oder Slop“-Fragen.
4. Speichert alles in `data/derived/slop_fixtures.json` (100% offline, null API-Kosten, null Latenz!).

---

## 6. Do's & Don'ts für die Umsetzung

| ✅ DO | ❌ DON'T |
|---|---|
| **Orange Bright Accent** (`#FF5C00`) & Liquid Glass | Keine graue, traurige Terminal- oder Standard-AI-Optik |
| **Max. 1-2 Sätze pro Screen/Card** | Keine Textwüsten oder langen Kuratorentexte |
| **Klare 2-Tab-Navigation** (Übersicht / Quests) | Keine verschachtelten Sub-Menüs oder Burger-Navis |
| **Fokus auf echte Linzer Orte** (Brunnen, Bäume) | Keine rein abstrakten oder erfundenen Orte |
| **Haptics (`expo-haptics`) bei jedem Klick** | Keine lautlosen, toten Buttons |
