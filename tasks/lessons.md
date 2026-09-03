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
