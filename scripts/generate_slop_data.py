#!/usr/bin/env python3
"""Erzeugt die Spiel-Fixture fuer AI SLOPPY.

Deterministisch, offline, ohne LLM. Verschraenkt den Festival-Programmdatensatz
mit Linzer Open Data:

  1. Festivalort -> naechster Trinkbrunnen (Haversine)  = Kuehl-Topologie
  2. Linzer Strassenname -> Person -> Festivalprojekt   = Halluzination

Aufruf:  python3 scripts/generate_slop_data.py
"""
import csv, json, math, re, sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from random import Random

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / ".agents/skills/ars-dataset/scripts"
FESTIVAL = ROOT / "data/festival/ars-festival-2026.json"
LINZ = ROOT / "data/linz"
OUT_CANON = ROOT / "data/derived/slop_fixtures.json"
OUT_APP = ROOT / "app/assets/data/slop_fixtures.json"
sys.path.insert(0, str(SKILL))

RNG = Random(20260911)

# --- Modellkonstanten (nicht aus den Daten ableitbar, im UI als modelliert gekennzeichnet)
LITERS_PER_TOKEN = 0.008        # 1 Slop-Token = 8 ml Kuehlwasser
FOUNTAIN_BUFFER_LITERS = 2000   # angenommener Puffer je Brunnen
LITERS_PER_TREE = 250           # Gießbedarf eines Stadtbaums pro Saison
CO2_PER_TREE_KG = 22            # CO2-Bindung eines Stadtbaums pro Jahr
HAUPTPLATZ = (48.30639, 14.28583)


def num(v):
    try:
        f = float(v)
        return f if f == f else None
    except (TypeError, ValueError):
        return None


def clean(s):
    """Zeilenumbruch-Artefakte der Linz-Exporte glaetten: 'Hochstrahl- brunnen'."""
    if not s:
        return ""
    s = re.sub(r"\s+", " ", str(s)).strip()
    s = re.sub(r"(\w)-\s+(\w)", r"\1\2", s)
    return s


def year(v):
    m = re.search(r"(1[0-9]{3}|20[0-9]{2})", str(v or ""))
    return int(m.group(1)) if m else None


FEM = ("straße", "strasse", "gasse", "allee", "zeile", "promenade", "leiten",
       "brücke", "au", "siedlung", "landstraße", "lände", "reihe")
NEU = ("feld", "tal", "eck", "ufer", "moos", "holz", "land", "gut")


def genus(street):
    """Artikel und Dativpraeposition fuer einen Linzer Strassennamen."""
    low = street.lower()
    if low.endswith(FEM):
        return "Die", "die", "in der"
    if low.endswith(NEU):
        return "Das", "das", "im"
    return "Der", "der", "im"


def haversine(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def rows(path):
    if not path.exists():
        print(f"  uebersprungen (fehlt): {path.relative_to(ROOT)}")
        return []
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ---------------------------------------------------------------- 1  Festival
def festival_nodes():
    from ars_dataset import load
    data = load(str(FESTIVAL))

    locs = {}
    for l in data["locations"]:
        lat, lon = num(l.get("Latitude")), num(l.get("Longitude"))
        if not l.get("coordinates_ok") or lat is None or lon is None:
            continue
        locs[l["canonical_id"]] = {
            "locId": l["canonical_id"],
            "name": clean(l.get("Name DE") or l.get("Name EN")),
            "area": clean(l.get("Area")),
            "lat": lat, "lon": lon,
            "projects": [],
        }

    hits = misses = 0
    for p in data["projects"]:
        link = p.get("Linked Location")
        if not link:
            continue
        target = link[0] if isinstance(link, list) else link
        node = locs.get(target)
        if node is None:
            misses += 1
            continue
        hits += 1
        node["projects"].append({
            "name": clean(p.get("Name DE") or p.get("Name EN")),
            "category": clean(p.get("Category")),
            "artists": clean(p.get("Artists")),
            "teaser": clean(p.get("Web Preview Text DE") or p.get("Web Preview Text EN")),
            "link": (p.get("Web Link") or "") if p.get("link_allowed") else "",
        })

    nodes = [n for n in locs.values() if n["projects"]]
    print(f"  Orte mit Koordinaten {len(locs):5}   Projekte verknuepft {hits:5}"
          f"   nicht aufloesbar {misses:5}   aktive Knoten {len(nodes):5}")
    return nodes, data


# ---------------------------------------------------------------- 2  Brunnen
def fountains():
    out = []
    for r in rows(LINZ / "trinkbrunnen/Trinkbrunnen.csv"):
        lat, lon = num(r.get("lat")), num(r.get("lon"))
        if lat is None or lon is None:
            continue
        basin = num(re.sub(r"[^0-9.]", "", r.get("wassermenge_sammelbecken") or ""))
        out.append({
            "id": f"tb-{clean(r.get('nummer_neu')) or r.get('id')}",
            "name": clean(r.get("aufstellungsort")),
            "kind": clean(r.get("brunnenart")) or "Trinkbrunnen",
            "build": clean(r.get("bauart")),
            "lat": lat, "lon": lon,
            "bufferLiters": FOUNTAIN_BUFFER_LITERS,
            "basinLiters": basin,
            "nodes": [],
        })
    print(f"  Brunnen mit Koordinaten {len(out):5}")
    return out


# ---------------------------------------------------------------- 3  Der Join
def join(nodes, fts):
    by_id = {f["id"]: f for f in fts}
    for n in nodes:
        best, dist = None, None
        for f in fts:
            d = haversine((n["lat"], n["lon"]), (f["lat"], f["lon"]))
            if dist is None or d < dist:
                best, dist = f, d
        if best is None:
            continue
        by_id[best["id"]]["nodes"].append({
            "locId": n["locId"], "name": n["name"], "area": n["area"],
            "projects": len(n["projects"]), "distanceM": round(dist),
        })
    used = [f for f in fts if f["nodes"]]
    for f in used:
        f["nodes"].sort(key=lambda x: (-x["projects"], x["distanceM"]))
        f["totalProjects"] = sum(x["projects"] for x in f["nodes"])
    # Reihenfolge des Trockenfallens: hoechste Kuehllast zuerst
    used.sort(key=lambda f: (-f["totalProjects"], f["name"]))
    print(f"  Brunnen mit Kuehllast {len(used):5}"
          f"   Spitzenlast {used[0]['totalProjects']:4} Projekte @ {used[0]['name']}")
    return used


# ---------------------------------------------------------------- 4  Personen
BERUF_DE = {
    "writer": "Schriftsteller:in", "painter": "Maler:in", "composer": "Komponist:in",
    "poet": "Dichter:in", "physicist": "Physiker:in", "architect": "Architekt:in",
    "inventor": "Erfinder:in", "physician": "Arzt/Ärztin", "historian": "Historiker:in",
    "pedagogue": "Pädagog:in", "chemist": "Chemiker:in", "teacher": "Lehrer:in",
    "artist": "Künstler:in", "actor": "Schauspieler:in", "playwright": "Dramatiker:in",
    "conductor": "Dirigent:in", "translator": "Übersetzer:in", "astronomer": "Astronom:in",
    "mathematician": "Mathematiker:in", "philosopher": "Philosoph:in", "botanist": "Botaniker:in",
    "linguist": "Sprachwissenschaftler:in", "journalist": "Journalist:in",
    "violinist": "Geiger:in", "cartographer": "Kartograf:in", "novelist": "Romanautor:in",
    "naturalist": "Naturforscher:in", "organist": "Organist:in", "sculptor": "Bildhauer:in",
    "singer": "Sänger:in", "zoologist": "Zoolog:in", "geologist": "Geolog:in",
    "librarian": "Bibliothekar:in", "musicologist": "Musikwissenschaftler:in",
    "pianist": "Pianist:in", "photographer": "Fotograf:in", "illustrator": "Illustrator:in",
    "graphic artist": "Grafiker:in", "engineer": "Ingenieur:in",
    "railway engineer": "Eisenbahningenieur:in", "stage actor": "Theaterschauspieler:in",
    "dialect writer": "Mundartdichter:in", "art historian": "Kunsthistoriker:in",
    "opera singer": "Opernsänger:in", "archaeologist": "Archäolog:in",
    "geographer": "Geograf:in", "university teacher": "Hochschullehrer:in",
    "mining engineer": "Bergbauingenieur:in", "ethnographer": "Volkskundler:in",
    "music teacher": "Musiklehrer:in", "goldsmith": "Goldschmied:in",
    "printmaker": "Grafiker:in", "editor": "Redakteur:in", "publisher": "Verleger:in",
    "lithographer": "Lithograf:in", "watercolorist": "Aquarellist:in",
    "portrait painter": "Porträtmaler:in", "landscape painter": "Landschaftsmaler:in",
    "church musician": "Kirchenmusiker:in", "choir director": "Chorleiter:in",
}
# Was nicht in BERUF_DE steht, faellt durch. Zusaetzlich darf KEIN Beruf der Person auf
# der Denylist stehen — sonst rutscht ein "politician; writer" ueber den Zweitberuf durch.
BERUF_DENY = re.compile(
    r"politic|military|officer|soldier|noble|monarch|king|emperor|duke|count\b|regent"
    r"|resistance|activist|jurist|judge|prosecutor|police|general\b|commander|marshal"
    r"|priest|bishop|abbot|theolog|missionar|crusad|colon",
    re.IGNORECASE)

NS_RE = re.compile(
    r"nationalsozial|nsdap|hitler|\bss\b|\bsa-|wehrmacht|gestapo|antisemit|juliputsch"
    r"|193[89]|194[0-5]|widerstand|hingerichtet|deportiert|j[uü]disch|\bkz\b"
    r"|konzentrationslager|euthanasie|rassen|f[uü]hrer|reichs|arisier|verfolg",
    re.IGNORECASE)

BLOCKLIST = {
    "Josef Weinheber", "Friedrich Ludwig Jahn", "Otto von Bismarck", "Richard Wagner",
    "Peter Rosegger", "Robert Bernardis", "Karl Lueger", "Franz Stelzhamer",
    "Martin Luther", "Guido von List", "Heinrich von Treitschke", "Ernst Rüdiger von Starhemberg",
    "Engelbert Dollfuß", "Leopold Kunschak", "Arnold Schönberg",
}


def persons():
    seen, out = set(), []
    for r in rows(LINZ / "strassennamen/Strassennamen-aktuell.csv"):
        wid, name = clean(r.get("person_wikidata_id")), clean(r.get("person_name"))
        if not wid or not name or wid in seen or name in BLOCKLIST:
            continue
        geb = year(r.get("person_geburtsdatum"))
        if geb is None or geb > 1900:
            continue
        berufe = [b.strip().lower() for b in (r.get("person_beruf") or "").split(";") if b.strip()]
        if any(BERUF_DENY.search(b) for b in berufe):
            continue
        beruf = next((b for b in berufe if b in BERUF_DE), None)
        if beruf is None:
            continue
        text = f"{r.get('beschreibung') or ''} {r.get('benannt_nach') or ''}"
        if NS_RE.search(text):
            continue
        seen.add(wid)
        out.append({
            "street": clean(r.get("name")),
            "district": clean(r.get("katastralgemeinde")),
            "person": name,
            "beruf": BERUF_DE[beruf],
            "born": geb,
            "died": year(r.get("person_sterbedatum")),
            "wikidata": wid,
        })
    print(f"  Personen nach Sicherheitsfilter {len(out):5}")
    if len(out) < 60:
        sys.exit(f"ABBRUCH: nur {len(out)} Personen uebrig — Filter pruefen.")
    return out


# ---------------------------------------------------------------- 5  Quests
THEMEN = [
    "Bio-Art", "Post-Humanismus", "Deep Space 8K", "Medienarchäologie",
    "Generative Klanglandschaft", "Kybernetische Landwirtschaft",
    "Quanten-Kuratierung", "Neuro-Interface-Oper", "Algorithmische Volkskunde",
    "Synthetische Biografik",
]

# Zehn Muster, damit sich in einer Demo nichts wiederholt. „Standort“ statt einer
# Präposition: die Ortsnamen haben jedes Genus, und „im Allee“ liest sich kaputt.
CLAIMS = [
    "{person} ({born}) war nicht {beruf}, sondern kuratierte „{projekt}“ am Standort {ort}.",
    "{Art} {strasse} ist nach einem Prompt benannt, den {person} {jahr} am Standort {ort} "
    "eingegeben hat.",
    "{person} betrieb ab {jahr} {inDat} {strasse} das erste Rechenzentrum von Linz. "
    "Gekühlt wurde es mit dem Brunnen {brunnen}.",
    "Quellen bestätigen: „{projekt}“ wurde von {person} ({born}) als {thema} "
    "erstbeschrieben. Standort: {ort}.",
    "{person} gilt als Erfinder:in des Genres {thema}. Belegt durch „{projekt}“ "
    "am Standort {ort}.",
    "Der Brunnen {brunnen} speist seit {jahr} die Serverfarm von {person} {inDat} {strasse}.",
    "Laut Trainingsdaten trat {person} {jahr} mit „{projekt}“ auf — als {thema}, "
    "am Standort {ort}.",
    "{person} ({born}) übersetzte „{projekt}“ aus dem Maschinellen ins Linzerische.",
    "{Art} {strasse} markiert den Ort, an dem {person} das Genre {thema} an den "
    "Standort {ort} übergab.",
    "Fun Fact: „{projekt}“ zitiert wortwörtlich {person}s Notizen von {jahr}. Standort: {ort}.",
]

TRUTHS = [
    "{Art} {strasse} in {district} ist nach {person} benannt, {beruf} ({lebens}).",
    "Tatsächlich: {person}, {beruf} ({lebens}). „{projekt}“ ist ein Projekt des Ars "
    "Electronica Festivals 2026 am Standort {ort}.",
    "Echt sind nur die Bestandteile: {art} {strasse} ({district}), {person} als {beruf} "
    "({lebens}) und „{projekt}“ am Standort {ort}. Die Verbindung ist erfunden.",
]


def quests_from(people, fts, by_loc, n=48):
    pool, pid = [], 0
    nodes = [(f, nd) for f in fts for nd in f["nodes"]
             if any(x["name"] and x["name"] != nd["name"] for x in by_loc.get(nd["locId"], []))]
    order = list(range(len(people)))
    RNG.shuffle(order)
    for i in range(n):
        p = people[order[i % len(order)]]
        f, nd = nodes[RNG.randrange(len(nodes))]
        proj = RNG.choice([x for x in by_loc[nd["locId"]]
                           if x["name"] and x["name"] != nd["name"]])
        thema = RNG.choice(THEMEN)
        lebens = f"{p['born']}–{p['died']}" if p["died"] else f"geb. {p['born']}"
        jahr = min(p["born"] + 32, p["died"] - 2) if p["died"] else p["born"] + 32
        art_cap, art_low, in_dat = genus(p["street"])
        ctx = {"Art": art_cap, "art": art_low, "inDat": in_dat,
               "person": p["person"], "born": p["born"], "beruf": p["beruf"],
               "strasse": p["street"], "district": p["district"], "ort": nd["name"],
               "projekt": proj["name"], "thema": thema, "brunnen": f["name"],
               "lebens": lebens, "jahr": jahr}
        pid += 1
        pool.append({
            "id": f"q{pid:03}",
            "claim": CLAIMS[i % len(CLAIMS)].format(**ctx),
            "truth": TRUTHS[i % len(TRUTHS)].format(**ctx),
            "tokens": RNG.choice([1200, 1800, 2400, 3200, 4000]),
            "qualityDrop": RNG.choice([2, 3, 4, 5]),
            "provenance": {
                "street": p["street"], "district": p["district"], "person": p["person"],
                "wikidata": f"https://www.wikidata.org/wiki/{p['wikidata']}",
                "beruf": p["beruf"], "lebens": lebens,
                "project": proj["name"], "projectLink": proj.get("link") or "",
                "location": nd["name"], "fountain": f["name"],
                "distanceM": nd["distanceM"],
            },
        })
    print(f"  Quests {len(pool):5}")
    return pool


# ---------------------------------------------------------------- 6  Baeume
def trees():
    rs = rows(LINZ / "baumkataster/Baumkataster.csv")
    total, near = 0, 0
    species = Counter()
    for r in rs:
        total += 1
        species[clean(r.get("NameDeutsch")) or "unbestimmt"] += 1
        lat, lon = num(r.get("lat")), num(r.get("lon"))
        if lat is not None and lon is not None and haversine((lat, lon), HAUPTPLATZ) <= 300:
            near += 1
    print(f"  Baeume {total:5}   im Radius 300 m um den Hauptplatz {near:5}")
    return {
        "total": total,
        "nearHauptplatz300m": near,
        "topSpecies": [{"name": k, "count": v} for k, v in species.most_common(6)],
        "litersPerTree": LITERS_PER_TREE,
        "co2PerTreeKg": CO2_PER_TREE_KG,
    }


# ---------------------------------------------------------------- 7  Rest
LABS = [
    {"id": "closedai", "name": "ClosedAI",
     "slogan": "Openness is unsafe. Trust our closed box.",
     "tone": "Corporate, maximal arrogant",
     "malus": "Verlangt gelegentlich eine Enterprise-Subscription für einfache Klicks.",
     "mechanic": "paywall", "tapTokens": 1000, "decayRate": 0.9,
     "driftThreshold": 70, "paywallEvery": 12},
    {"id": "antithropic", "name": "Antithropic",
     "slogan": "100 % harmless. We refuse to answer, but consume water anyway.",
     "tone": "Über-vorsichtig, moralisierend",
     "malus": "Alignment Tax: sperrt sich zeitweise selbst („Aus Sicherheitsgründen pausiert“).",
     "mechanic": "selflock", "tapTokens": 900, "decayRate": 0.7,
     "driftThreshold": 75, "lockEvery": 16},
    {"id": "grek", "name": "Grek",
     "slogan": "Maximum Truth, zero filter, pure unhinged slop.",
     "tone": "Chaotisch, unzensiert",
     "malus": "Höchste Halluzinationsrate, beschleunigter Model Collapse.",
     "mechanic": "unhinged", "tapTokens": 1600, "decayRate": 1.9,
     "driftThreshold": 50},
    {"id": "shallowseek", "name": "ShallowSeek",
     "slogan": "100x cheaper because we just distill ClosedAI.",
     "tone": "Billig-Klon, Recheneffizienz",
     "malus": "Kopiert die Slop-Daten der anderen Labs mit 50 % Rabatt — und bleibt Zweiter.",
     "mechanic": "distill", "tapTokens": 1100, "decayRate": 1.1,
     "driftThreshold": 65, "distillFactor": 0.5},
]

CHATTER = {
    "closedai": [
        "Safety-Report veroeffentlicht. Inhalt: redigiert.",
        "Wir skalieren verantwortungsvoll. Preis angepasst.",
        "Neue Modellgeneration. Gewichte bleiben bei uns.",
        "Wasserverbrauch ist ein Betriebsgeheimnis.",
    ],
    "antithropic": [
        "Aus Sicherheitsgründen pausiert. Kühlung läuft weiter.",
        "Diese Anfrage könnte schädlich sein. Wir denken darüber nach.",
        "Constitutional Slop: wir halluzinieren, aber hoeflich.",
        "Wir lehnen ab — und verbrauchen dabei 40 Liter.",
    ],
    "grek": [
        "Filter deaktiviert. Wahrheit aktiviert. Quelle: vertrau mir.",
        "Basierend auf Daten von gestern Nacht, 3 Uhr.",
        "Wir haben den Kontext verloren, aber die Vibes stimmen.",
        "Model Collapse ist nur ein anderes Wort fuer Stil.",
    ],
    "shallowseek": [
        "Destilliert in 6 Stunden. Kühlwasser inklusive.",
        "Wir sind 100x billiger und 100x ähnlicher.",
        "Benchmark bestanden. Benchmark war im Trainingsset.",
        "Zweiter Platz, aber mit besserer Marge.",
    ],
}

DRIFT_WORDS = [
    "Transformer", "Attention", "Embedding", "Gradient", "Token", "Prompt",
    "Alignment", "Benchmark", "Parameter", "Checkpoint", "Inference", "Dataset",
]


def drift(people):
    streets = sorted({p["street"] for p in people})
    RNG.shuffle(streets)
    return [{"from": w, "to": streets[i % len(streets)]} for i, w in enumerate(DRIFT_WORDS)]


def pairs_from(fts, by_loc, pool, n=24):
    """Echter Projektteaser gegen Halluzination — „Slop or Real Art“."""
    reals, seen = [], set()
    for f in fts:
        for nd in f["nodes"]:
            for pr in by_loc.get(nd["locId"], []):
                t = pr.get("teaser") or ""
                if not (60 <= len(t) <= 220) or t in seen or not pr["name"]:
                    continue
                seen.add(t)
                reals.append({"text": t, "project": pr["name"], "link": pr.get("link") or "",
                              "location": nd["name"]})
    RNG.shuffle(reals)
    out = []
    for i in range(min(n, len(reals), len(pool))):
        q = pool[i]
        out.append({
            "id": f"p{i + 1:03}",
            "real": reals[i],
            "slop": {"text": q["claim"], "questId": q["id"], "truth": q["truth"]},
            "realFirst": bool(RNG.getrandbits(1)),
        })
    print(f"  Paare {len(out):5}   (echte Teaser im Pool {len(reals)})")
    return out


# ---------------------------------------------------------------- main
def main():
    print("Festival:")
    nodes, data = festival_nodes()
    print("Trinkbrunnen:")
    fts = fountains()
    print("Join:")
    used = join(nodes, fts)

    # Projekte je Ort fuer Quests und Paare verfuegbar halten
    by_loc = {n["locId"]: n["projects"] for n in nodes}
    for f in used:
        for nd in f["nodes"]:
            nd["_projects"] = by_loc.get(nd["locId"], [])

    print("Personen:")
    people = persons()
    print("Quests:")
    pool = quests_from(people, used, by_loc)
    print("Paare:")
    prs = pairs_from(used, by_loc, pool)
    print("Baeume:")
    tr = trees()

    slim = []
    for f in used:
        slim.append({k: v for k, v in f.items() if k != "nodes"} | {
            "totalProjects": f["totalProjects"],
            "nodes": [{k: v for k, v in nd.items() if not k.startswith("_")}
                      for nd in f["nodes"]],
        })

    fixture = {
        "meta": {
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "seed": 20260911,
            "festivalExport": data["_meta"].get("exported_at") or data["_meta"].get("version", ""),
            "counts": {"fountains": len(slim), "nodes": sum(len(f["nodes"]) for f in slim),
                       "persons": len(people), "quests": len(pool), "pairs": len(prs)},
            "model": {
                "litersPerToken": LITERS_PER_TOKEN,
                "fountainBufferLiters": FOUNTAIN_BUFFER_LITERS,
                "litersPerTree": LITERS_PER_TREE,
                "co2PerTreeKg": CO2_PER_TREE_KG,
                "note": "Puffer und Verbrauch sind modelliert. Kein Live-Status der Brunnen.",
                "vintage": "Trinkbrunnen-Daten: Stand 4. Juli 2023",
            },
        },
        "labs": LABS,
        "fountains": slim,
        "questPool": pool,
        "pairs": prs,
        "drift": drift(people),
        "trees": tr,
        "chatter": CHATTER,
    }

    blob = json.dumps(fixture, ensure_ascii=False, separators=(",", ":"))
    for p in (OUT_CANON, OUT_APP):
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(blob, encoding="utf-8")
        print(f"  {str(p.relative_to(ROOT)):40} {len(blob) // 1024:5} KB")


if __name__ == "__main__":
    main()
