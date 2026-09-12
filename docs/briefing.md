# Briefing — AI Hackathon @ Ars Electronica Festival 2026

Recherchestand: 3. September 2026. Quelle: <https://hackathon.ars.electronica.art/de/>

## Eckdaten

| | |
|---|---|
| **Was** | AI Hackathon, Sub-Event des Ars Electronica Festivals |
| **Motto** | Future Begins / *NEGOTIATING HUMANITY* |
| **Wann** | Fr 11.9.2026, 09:30–18:00 · Sa 12.9.2026, 09:30–16:00 (Türen jeweils 09:00) |
| **Wo** | Grand Garage, Linz |
| **Team** | 2–5 Personen (wir: 2) |
| **Kosten** | gratis, Verpflegung inklusive |
| **Anmeldung** | partizipation.linz.at — Deadline war 7.9.; wir sind **ohne Add-ons** angemeldet |
| **Parallel** | Beijing–Linz Joint Hackathon „City of the Future", 300+ Studierende aus 100+ chinesischen Universitäten |

## Der entscheidende Punkt: Community Voting

**Es gibt keine Jury.** Gewonnen wird per Community Voting am Samstagnachmittag, nach Kurz-Pitches.

Bewertet werden laut Ausschreibung: *Idee, Kreativität, Originalität, Umsetzung und die Qualität der Verbindung zwischen den beiden Datenwelten.*

Was daraus folgt — das ist unsere gesamte Strategie:

1. **Das Publikum muss es selbst ausprobieren können.** Wer nur ein Video zeigt, verliert gegen jemanden, den man anfassen kann. Ursprünglich war dafür eine öffentliche URL plus QR-Code geplant; seit dem 11.09.2026 lösen wir es umgekehrt — SELBERDENKEN ist eine native iOS-App, und das Vorführ-iPhone wandert durchs Publikum. Das ist anfassbarer als ein Link und fällt nicht mit dem WLAN aus.
2. **Es muss in unter 60 Sekunden zünden.** Wähler:innen sind müde Teilnehmende und Festivalpublikum, kein Fachgremium. Kein technisches Deep-Dive.
3. **Beide Datenwelten müssen strukturell verschränkt sein**, nicht dekorativ nebeneinanderliegen. „Wir zeigen Festivalorte auf einer Linz-Karte" erfüllt das Kriterium nicht — die Karte ist Beiwerk. Es zählt eine Verbindung, die ohne beide Datensätze nicht existieren könnte.
4. **Ars-Electronica-Publikum ist ein Kunstpublikum.** Haltung, Reibung und ein Gedanke, der hängen bleibt, schlagen technische Tiefe. Ein Projekt, das etwas *behauptet*, gewinnt gegen eines, das nur etwas *kann*.
5. **Nur ~13 Netto-Arbeitsstunden.** Scope brutal klein halten. Eine Sache, die vollständig funktioniert.

## Was die Konkurrenz bauen wird

Die Veranstalter stellen vier offizielle Beispielprojekte bereit. Sie sind die Vorlage, an der sich unerfahrene Teams orientieren werden — und damit die Liste der verbrannten Ideen:

| Beispiel | Was es tut |
|---|---|
| `whats-near-me` | „Was ist in meiner Nähe" — Trinkbrunnen, WCs, Festivalorte |
| `festival-day-weaver` | Tagesplaner mit Fußwegen, Zeitkonflikten, WC/Wasser in der Nähe |
| `pi-dev-calendar` | Minimaler Festivalkalender |
| `2026-08-04-rag-example` | Semantische Suche / RAG über die Projektbeschreibungen |

**Konsequenz:** Festivalplaner, Umkreissuche, Kalender und „Chatbot fürs Programm" sind tote Ideen. Sie werden mehrfach gebaut werden, in schlechter, und sie sind bereits als Beispielcode vorhanden — Originalität ist dort nicht zu holen.

## Ablauf und was wann zu tun ist

- **Fr 09:30** Kick-off, Vorstellung der Mentor:innen, Team-Matching
- **Fr bis 18:00** Entwicklung, Mittagspause gegen 12:00
- **Sa 09:30–16:00** Weiterentwicklung, dann Kurz-Pitches
- **Sa Nachmittag** Community Voting, Siegerehrung

Detaillierter Zwei-Tages-Plan mit Puffer: siehe [`../tasks/todo.md`](../tasks/todo.md).

## Unser Setup

Wir sind **ohne Add-ons** angemeldet — kein OpenRouter-Key, kein pi.dev. Wir arbeiten mit eigenem Setup:

1. **Claude Code** (primär)
2. **Antigravity** oder **Codex** (Fallback, wenn Tokens ausgehen)

Alle drei lesen denselben Kontext: `CLAUDE.md`, `AGENTS.md` und `GEMINI.md` sind Symlinks auf eine Datei. Die vier offiziellen Hackathon-Skills liegen in `.agents/skills/` und sind für alle drei Agents installiert.

Daraus folgt zwei Dinge für die Planung:
- **Kein Verlass auf Hackathon-Infrastruktur.** Kein Mistral-Budget, keine gehostete Umgebung. Alles läuft über unsere Laptops und ein Vorführ-iPhone — nichts ist gehostet, also kann auch nichts ausfallen.
- **Wenn das Projekt ein LLM zur Laufzeit braucht**, brauchen wir einen eigenen API-Key. Besser: LLM-Arbeit *vorberechnen* (siehe `datasets.md`), sodass die Live-Demo ohne API-Call auskommt. Das ist zugleich der beste Schutz gegen schlechtes WLAN in der Grand Garage.

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| WLAN in der Grand Garage bricht zusammen | Statischer Build, alle Daten vorberechnet im Bundle; lokaler Fallback auf `localhost` plus Handy-Hotspot |
| Live-LLM-Call in der Demo hängt | Keine LLM-Calls im kritischen Demo-Pfad; vorberechnete Ergebnisse ausliefern |
| Scope zu groß, Sa 15:00 nichts Vorzeigbares | Ab Fr 16:00 gilt: was steht, steht. Feature-Freeze Sa 13:00 |
| Voting-Publikum versteht die Idee nicht | Pitch am Sa früh an fremden Teams testen, nicht erst auf der Bühne |
