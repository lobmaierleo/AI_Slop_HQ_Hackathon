#!/usr/bin/env python3
"""Erzeugt data/SUMMARY.md - die eine Datei, die ein Agent liest, statt Rohdaten zu laden.

Aufruf:  python3 scripts/build_summary.py
"""
import csv, json, sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FESTIVAL = ROOT / "data/festival/ars-festival-2026.json"
LINZ = ROOT / "data/linz"
OUT = ROOT / "data/SUMMARY.md"
MAX_VALUES = 8      # so viele haeufigste Werte je Feld
SAMPLE_CHARS = 60


def top_values(records, field, n=MAX_VALUES):
    c = Counter()
    for r in records:
        v = r.get(field)
        if isinstance(v, list):
            c.update(str(x) for x in v[:1])          # nur erstes Element, Listen sind IDs
        elif v not in (None, "", [], {}):
            c.update([str(v)[:40]])
    return c.most_common(n), len(c)


def festival_section(lines):
    if not FESTIVAL.exists():
        lines.append("> Festival-Export fehlt. Holen mit:\n> `python3 .agents/skills/ars-dataset/scripts/ars_dataset.py download -o data/festival/ars-festival-2026.json`\n")
        return
    d = json.loads(FESTIVAL.read_text(encoding="utf-8"))
    meta = d.get("_meta", {})
    lines.append(f"## Festival 2026\n")
    lines.append(f"`data/festival/ars-festival-2026.json` - Export {meta.get('generated_at','?')}, "
                 f"schema {meta.get('schema_version','?')}\n")
    for db in ("projects", "calendar", "contacts", "locations"):
        recs = d.get(db, [])
        lines.append(f"\n### {db} ({len(recs)})\n")
        fields = Counter()
        for r in recs:
            fields.update(r.keys())
        for f in fields:
            if f.startswith("Linked") or f in ("id", "canonical_id", "id_source"):
                continue
            vals, distinct = top_values(recs, f)
            if not vals:
                continue
            if distinct <= MAX_VALUES:
                shown = ", ".join(f"{v} ({n})" for v, n in vals)
                lines.append(f"- `{f}` -> {shown}")
            else:
                ex = vals[0][0][:SAMPLE_CHARS].replace("\n", " ")
                lines.append(f"- `{f}` -> {distinct} versch. Werte, z.B. \"{ex}\"")


def linz_section(lines):
    lines.append("\n## Open Data Linz\n")
    lines.append("Ein Ordner je Datensatz unter `data/linz/`, jeweils mit geprueftem `README.md`.\n")
    for folder in sorted(p for p in LINZ.iterdir() if p.is_dir()):
        files = [f for f in folder.iterdir()
                 if f.suffix in (".csv", ".json", ".geojson") and not f.name.startswith("prepare")]
        if not files:
            lines.append(f"\n### {folder.name}\nNur Dokumentation lokal - Daten muessen abgerufen werden (siehe `{folder.name}/README.md`).")
            continue
        lines.append(f"\n### {folder.name}")
        for f in sorted(files, key=lambda p: -p.stat().st_size)[:4]:
            rel = f.relative_to(ROOT)
            kb = f.stat().st_size // 1024
            if f.suffix == ".csv":
                with f.open(encoding="utf-8", errors="replace") as fh:
                    rd = csv.DictReader(fh)
                    cols = rd.fieldnames or []
                    rows = sum(1 for _ in rd)
                lines.append(f"- `{rel}` - {rows} Zeilen, {kb} KB\n  Spalten: {', '.join(cols)}")
            else:
                try:
                    j = json.loads(f.read_text(encoding="utf-8"))
                except Exception as e:
                    lines.append(f"- `{rel}` - {kb} KB (nicht lesbar: {e})")
                    continue
                if isinstance(j, dict) and j.get("type") == "FeatureCollection":
                    feats = j.get("features", [])
                    props = sorted({k for ft in feats[:50] for k in (ft.get("properties") or {})})
                    geoms = Counter((ft.get("geometry") or {}).get("type") for ft in feats)
                    lines.append(f"- `{rel}` - GeoJSON, {len(feats)} Features {dict(geoms)}, {kb} KB\n  Properties: {', '.join(props)}")
                elif isinstance(j, list):
                    keys = sorted({k for it in j[:50] if isinstance(it, dict) for k in it})
                    lines.append(f"- `{rel}` - JSON-Liste, {len(j)} Eintraege, {kb} KB\n  Keys: {', '.join(keys)}")
                else:
                    lines.append(f"- `{rel}` - JSON-Objekt, Top-Keys: {', '.join(list(j)[:12])}, {kb} KB")


def main():
    lines = ["# Datenuebersicht (generiert)",
             "",
             "Erzeugt von `scripts/build_summary.py`. **Diese Datei lesen, nicht die Rohdaten.**",
             "Erklaerung und Join-Regeln: `docs/datasets.md`.",
             ""]
    festival_section(lines)
    linz_section(lines)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)} geschrieben - {len(lines)} Zeilen, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    sys.exit(main())
