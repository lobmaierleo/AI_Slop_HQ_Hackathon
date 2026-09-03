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
