#!/usr/bin/env python3
"""Erzeugt schlanke, app-fertige JSON-Dateien in app/public/data/.

Die Rohdaten bleiben in data/. Die App bekommt nur, was sie im Browser laden kann.
Aufruf:  python3 scripts/build_app_data.py
"""
import csv, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app/public/data"
SKILL = ROOT / ".agents/skills/ars-dataset/scripts"
sys.path.insert(0, str(SKILL))


def num(v):
    try:
        f = float(v)
        return f if f == f else None       # NaN raus
    except (TypeError, ValueError):
        return None


def write(name, obj):
    p = OUT / name
    p.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n = len(obj) if isinstance(obj, list) else len(obj.get("features", obj))
    print(f"  {name:28} {n:6} Eintraege  {p.stat().st_size // 1024:5} KB")


def festival():
    from ars_dataset import load, event_rows                     # offizieller Skill
    src = ROOT / "data/festival/ars-festival-2026.json"
    data = load(str(src))

    locations = [{
        "id": l["canonical_id"], "name": l.get("Name EN") or l.get("Name DE"),
        "area": l.get("Area"), "type": l.get("Type"), "address": l.get("Address"),
        "lat": num(l.get("Latitude")), "lon": num(l.get("Longitude")),
    } for l in data["locations"]]
    write("festival-locations.json", [l for l in locations if l["lat"] and l["lon"]])

    projects = [{
        "id": p["canonical_id"], "nameEn": p.get("Name EN"), "nameDe": p.get("Name DE"),
        "category": p.get("Category"), "artists": p.get("Artists"),
        "highlight": p.get("Curatorial Highlight") == "Yes",
        "language": p.get("Language"), "ticket": p.get("Linked Ticket"),
        "descEn": (p.get("Description EN") or "")[:600],
        "url": p.get("Web Link"),
    } for p in data["projects"]]
    write("festival-projects.json", projects)

    rows = event_rows(data)
    events = []
    for r in rows:
        d = r if isinstance(r, dict) else dict(r)
        start = d.get("start_dt")
        events.append({
            "projectId": d.get("project_id") or d.get("project_ref"),
            "start": str(start) if start else None,
            "category": d.get("category") or d.get("Category"),
            "lat": num(d.get("lat")), "lon": num(d.get("lon")),
        })
    write("festival-events.json", events)

    countries = {}
    for c in data["contacts"]:
        v = c.get("Country")
        if not v:
            continue
        for part in str(v).split(","):
            part = part.strip()
            if len(part) > 2:
                iso, name = part[:2], part[3:]
                countries.setdefault(iso, {"iso2": iso, "name": name, "count": 0})["count"] += 1
    write("festival-countries.json", sorted(countries.values(), key=lambda x: -x["count"]))


def linz_points():
    """Punktdatensaetze mit lon/lat zu einer gemeinsamen Datei zusammenfassen."""
    specs = [
        ("trinkbrunnen/Trinkbrunnen.csv",           "trinkbrunnen",  "aufstellungsort", ["brunnenart", "trinkwasser"]),
        ("wc-anlagen/WC-Anlagen.csv",               "wc",            "name",            ["barrierefrei", "eurokey", "wickeltisch"]),
        ("defibrillatoren/Defibrillatoren.csv",     "defibrillator", None,              []),
        ("hecken-die-schmecken/Hecken-die-schmecken.csv", "hecke",   None,              []),
        ("hotspots/Hotspot-Standorte.csv",          "wlan",          "name",            []),
    ]
    out = []
    for rel, kind, name_field, extra in specs:
        f = ROOT / "data/linz" / rel
        if not f.exists():
            print(f"  uebersprungen (fehlt): {rel}")
            continue
        with f.open(encoding="utf-8", errors="replace") as fh:
            for row in csv.DictReader(fh):
                lat, lon = num(row.get("lat")), num(row.get("lon"))
                if not (lat and lon):
                    continue
                item = {"kind": kind, "lat": lat, "lon": lon}
                for guess in ([name_field] if name_field else []) + ["name", "bezeichnung", "standort"]:
                    if guess and row.get(guess):
                        item["name"] = row[guess]
                        break
                for e in extra:
                    if row.get(e):
                        item[e] = row[e]
                out.append(item)
    write("linz-points.json", out)


def linz_streets():
    f = ROOT / "data/linz/strassennamen/Strassennamen-aktuell.csv"
    if not f.exists():
        return
    with f.open(encoding="utf-8", errors="replace") as fh:
        rows = [{
            "name": r["name"], "kg": r.get("katastralgemeinde"),
            "person": r.get("person_name") or None,
            "gender": r.get("person_geschlecht") or None,
            "job": r.get("person_beruf") or None,
            "wikidata": r.get("person_wikidata_id") or None,
        } for r in csv.DictReader(fh)]
    write("linz-streets.json", rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Festival:")
    festival()
    print("Linz:")
    linz_points()
    linz_streets()
    print(f"\n-> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
