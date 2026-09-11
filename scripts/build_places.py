#!/usr/bin/env python3
"""Erzeugt app/data/places.json fuer die Kartenansicht.

Verbindet Festival-Spielorte mit Linzer Open Data (Trinkbrunnen).
Die Rohdaten bleiben in data/, die App bekommt nur die Marker, die sie zeichnet.
Aufruf:  python3 scripts/build_places.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app/data/places.json"

# Nur Orte, die man als Besucher tatsaechlich ansteuert. Room und Floor liegen
# auf denselben Koordinaten wie ihr Gebaeude und wuerden die Karte zupflastern.
VENUE_TYPES = {"Building", "Outdoor"}


def num(value):
    try:
        f = float(value)
        return f if f == f else None
    except (TypeError, ValueError):
        return None


def venues():
    src = json.loads((ROOT / "data/festival/ars-festival-2026.json").read_text(encoding="utf-8"))
    out = []
    for loc in src["locations"]:
        if loc.get("Type") not in VENUE_TYPES:
            continue
        if not (loc.get("public_for_hackathon") and loc.get("coordinates_ok")):
            continue
        lat, lon = num(loc.get("Latitude")), num(loc.get("Longitude"))
        if lat is None or lon is None:
            continue
        out.append({
            # Voller canonical_id: die Festival-IDs teilen sich einen langen
            # gemeinsamen Praefix, gekuerzte Varianten kollidieren.
            "id": loc["canonical_id"],
            "name": loc.get("Name EN") or loc.get("Name DE"),
            "area": loc.get("Area"),
            "type": loc.get("Type"),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
        })
    return sorted(out, key=lambda v: (v["area"] or "", v["name"] or ""))


def fountains():
    src = ROOT / "data/linz/trinkbrunnen/Trinkbrunnen.csv"
    out = []
    with src.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row["trinkwasser"] != "true" or row["in_betrieb"] == "false":
                continue
            lat, lon = num(row["lat"]), num(row["lon"])
            if lat is None or lon is None:
                continue
            out.append({
                "id": f"tb{row['id']}",
                "name": row["aufstellungsort"].strip(),
                "kind": row["brunnenart"].strip(),
                "lat": round(lat, 6),
                "lon": round(lon, 6),
            })
    return out


def main():
    data = {"venues": venues(), "fountains": fountains()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}  {len(data['venues'])} Spielorte  "
          f"{len(data['fountains'])} Brunnen  {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
