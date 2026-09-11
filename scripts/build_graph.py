#!/usr/bin/env python3
"""Erzeugt app/data/graph.json: das Synapsen-Netz der Entdeckungsorte.

Die Knotenpositionen sind die echten Linzer Koordinaten, auf 0..1 normalisiert
und anschliessend so weit auseinandergeschoben, dass sich keine zwei Knoten
ueberlappen. Damit zeigen Karte und Netz-Tab dieselbe Anordnung -- wer den
Hauptplatz auf der Karte gesehen hat, findet ihn im Graphen an derselben Stelle.

Kanten entstehen auf zwei Achsen:
  theme  gleiche Kategorie, einer der beiden naechsten Verwandten
         (Wasseradern, urbane Natur, Festival-Cluster)
  space  die eine Bruecke in eine andere Datenwelt: der naechste Nachbar
         anderer Kategorie, sofern er unter SPACE_RADIUS_M liegt -- genau
         hier verschraenken sich Festivaldaten und Linzer Open Data

Jeder Knoten bekommt hoechstens eine raeumliche Bruecke. Alle Paare unter dem
Radius zu verbinden ergaebe bei 23 Knoten 60 Kanten, und das Netz waere ein
Filz statt eines lesbaren Graphen.

Alles wird vorberechnet. Zur Laufzeit animiert die App nur noch.
Aufruf:  python3 scripts/build_graph.py
"""
import json
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app/data/quests.json"
OUT = ROOT / "app/data/graph.json"

THEME_NEIGHBOURS = 2       # so viele naechste Verwandte je Knoten
SPACE_RADIUS_M = 400.0     # Luftlinie fuer eine raeumliche Synapse
MIN_GAP = 0.075            # Mindestabstand im normalisierten Raum
RELAX_STEPS = 60
PULL_HOME = 0.04           # Ruecksstellkraft zur echten Geoposition


def meters(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    """Haversine. Gleiche Formel wie in build_quests.py."""
    p1, p2 = radians(lat_a), radians(lat_b)
    dp, dl = p2 - p1, radians(lon_b - lon_a)
    h = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * 6371000 * asin(sqrt(h))


def normalise(quests: list[dict]) -> list[list[float]]:
    """Geokoordinaten auf 0..1, mit Breitengrad-Korrektur der Laenge.

    Ohne den cos-Faktor waere Linz in der Ost-West-Achse um rund ein Drittel
    gestaucht und das Netz saehe verzerrt aus.
    """
    lats = [q["lat"] for q in quests]
    lons = [q["lon"] for q in quests]
    mid = radians(sum(lats) / len(lats))
    xs = [lon * cos(mid) for lon in lons]

    def span(values: list[float]) -> tuple[float, float]:
        lo, hi = min(values), max(values)
        return lo, (hi - lo) or 1.0

    x_lo, x_rng = span(xs)
    y_lo, y_rng = span(lats)
    # y invertiert: Norden gehoert nach oben, SVG zaehlt nach unten.
    return [[(x - x_lo) / x_rng, 1.0 - (y - y_lo) / y_rng] for x, y in zip(xs, lats)]


def relax(points: list[list[float]]) -> list[list[float]]:
    """Schiebt zu nahe Knoten auseinander, zieht sie aber nach Hause zurueck."""
    home = [p[:] for p in points]
    pts = [p[:] for p in points]
    for _ in range(RELAX_STEPS):
        for i, a in enumerate(pts):
            for j in range(i + 1, len(pts)):
                b = pts[j]
                dx, dy = b[0] - a[0], b[1] - a[1]
                d = sqrt(dx * dx + dy * dy)
                if d >= MIN_GAP:
                    continue
                if d < 1e-6:                       # exakt deckungsgleich
                    dx, dy, d = 1e-3, 0.0, 1e-3
                push = (MIN_GAP - d) / 2
                ux, uy = dx / d * push, dy / d * push
                a[0] -= ux; a[1] -= uy
                b[0] += ux; b[1] += uy
        for p, h in zip(pts, home):
            p[0] += (h[0] - p[0]) * PULL_HOME
            p[1] += (h[1] - p[1]) * PULL_HOME

    # Nach dem Schieben neu einpassen, damit nichts aus der Flaeche ragt.
    for axis in (0, 1):
        lo = min(p[axis] for p in pts)
        rng = (max(p[axis] for p in pts) - lo) or 1.0
        for p in pts:
            p[axis] = (p[axis] - lo) / rng
    return pts


def edges(quests: list[dict]) -> list[dict]:
    found: dict[tuple[str, str], str] = {}

    for i, a in enumerate(quests):
        same = sorted(
            (
                (meters(a["lat"], a["lon"], b["lat"], b["lon"]), b["id"])
                for j, b in enumerate(quests)
                if j != i and b["type"] == a["type"]
            )
        )
        for _, other in same[:THEME_NEIGHBOURS]:
            found.setdefault(tuple(sorted((a["id"], other))), "theme")

        other = sorted(
            (
                (meters(a["lat"], a["lon"], b["lat"], b["lon"]), b["id"])
                for j, b in enumerate(quests)
                if j != i and b["type"] != a["type"]
            )
        )
        if other and other[0][0] <= SPACE_RADIUS_M:
            found.setdefault(tuple(sorted((a["id"], other[0][1]))), "space")

    return [{"a": a, "b": b, "kind": k} for (a, b), k in sorted(found.items())]


def main() -> None:
    quests = json.loads(SRC.read_text(encoding="utf-8"))["photoQuests"]
    missing = [q["id"] for q in quests if q.get("lat") is None or q.get("lon") is None]
    if missing:
        raise SystemExit(f"Quests ohne Koordinate, Graph nicht baubar: {missing}")

    pts = relax(normalise(quests))
    nodes = [
        {"id": q["id"], "type": q["type"], "x": round(x, 4), "y": round(y, 4)}
        for q, (x, y) in zip(quests, pts)
    ]
    links = edges(quests)

    # Ein Knoten ohne jede Kante waere im Netz-Tab eine tote Insel.
    connected = {e["a"] for e in links} | {e["b"] for e in links}
    lonely = [n["id"] for n in nodes if n["id"] not in connected]
    if lonely:
        raise SystemExit(f"Knoten ohne Synapse: {lonely} -- THEME_NEIGHBOURS erhoehen")

    OUT.write_text(
        json.dumps({"nodes": nodes, "edges": links}, ensure_ascii=False,
                   separators=(",", ":")),
        encoding="utf-8",
    )
    by_kind = {k: sum(1 for e in links if e["kind"] == k) for k in ("theme", "space")}
    print(f"  graph.json  {len(nodes)} Knoten, {len(links)} Kanten "
          f"({by_kind['theme']} thematisch, {by_kind['space']} raeumlich)")


if __name__ == "__main__":
    main()
