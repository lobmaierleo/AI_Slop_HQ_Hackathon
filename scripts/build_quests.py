#!/usr/bin/env python3
"""Erzeugt app/data/quests.json aus den echten Datensaetzen.

Die Texte sind handgeschrieben, Koordinaten und Kennzahlen kommen ausnahmslos
aus den Rohdaten. Damit kann kein Fakt aus Versehen erfunden werden: jeder
Anker wird beim Build aufgeloest und schlaegt fehl, wenn der Datensatz sich
aendert.

    python3 scripts/build_quests.py
"""

from __future__ import annotations

import csv
import json
import math
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINZ = ROOT / "data" / "linz"
OUT = ROOT / "app" / "data" / "quests.json"

# Schwerpunkt der Festival-Spielorte, dient nur als Plausibilitaetscheck.
FESTIVAL_LAT, FESTIVAL_LON = 48.30481, 14.29123
MAX_QUEST_DISTANCE_M = 1400


def die(msg: str) -> None:
    print(f"FEHLER: {msg}", file=sys.stderr)
    raise SystemExit(1)


def meters(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    dy = (lat_a - lat_b) * 111_320
    dx = (lon_a - lon_b) * 111_320 * math.cos(math.radians(lat_a))
    return math.hypot(dx, dy)


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


# --------------------------------------------------------------------------
# Quellen
# --------------------------------------------------------------------------

fountains = read_csv(LINZ / "trinkbrunnen" / "Trinkbrunnen.csv")
trees = read_csv(LINZ / "baumkataster" / "Baumkataster.csv")
hotspots = read_csv(LINZ / "hotspots" / "Hotspot-Standorte.csv")
defis = read_csv(LINZ / "defibrillatoren" / "Defibrillatoren.csv")
venues = json.loads((ROOT / "app" / "data" / "places.json").read_text())["venues"]

FOUNTAIN_BY_ID = {}
for row in fountains:
    FOUNTAIN_BY_ID.setdefault(row["nummer_neu"], []).append(row)

# BaumNr ist nur innerhalb einer Flaeche eindeutig, daher der zusammengesetzte Key.
TREE_BY_KEY = {}
for row in trees:
    TREE_BY_KEY.setdefault((row["Flaeche"], row["BaumNr"]), []).append(row)

HOTSPOT_BY_NAME = {}
for row in hotspots:
    HOTSPOT_BY_NAME.setdefault(row["name"], []).append(row)

DEFI_BY_KEY = {}
for row in defis:
    DEFI_BY_KEY.setdefault((row["Adresse"], row["Standort"]), []).append(row)

VENUE_BY_NAME = {}
for row in venues:
    VENUE_BY_NAME.setdefault(row["name"], []).append(row)


def unique(index: dict, key, label: str) -> dict:
    hits = index.get(key)
    if not hits:
        die(f"{label}: {key!r} nicht gefunden")
    if len(hits) > 1:
        die(f"{label}: {key!r} ist {len(hits)}-fach vorhanden, Anker waere mehrdeutig")
    return hits[0]


def assert_no_larger(anchor: dict, field: str, radius_m: float, claim: str) -> None:
    """Sichert eine Superlativ-Aussage im Questtext gegen den Datensatz ab.

    Superlative veralten lautlos, sobald der Kataster nachgefuehrt wird. Statt
    sie im Text zu behaupten, wird hier nachgerechnet: kein anderer Baum im
    Umkreis darf einen groesseren Wert tragen.
    """
    row = unique(TREE_BY_KEY, (anchor["area"], anchor["no"]), "Baum")
    mine = float(row[field])
    for other in trees:
        if not other["lat"] or not other[field]:
            continue
        try:
            value = float(other[field])
        except ValueError:
            continue
        if value <= mine:
            continue
        if meters(float(other["lat"]), float(other["lon"]), FESTIVAL_LAT, FESTIVAL_LON) <= radius_m:
            die(f"{claim}: Baum {other['Flaeche']}/{other['BaumNr']} hat {field} {value}, "
                f"Anspruch war {mine}")


def resolve(anchor: dict) -> tuple[float, float, dict]:
    """Loest den Anker auf und liefert Koordinate plus die Quellzeile.

    Die Zeile wird gebraucht, weil der Fakt, den die App nach dem Besuch
    freischaltet, direkt aus ihr formatiert wird. So kann er nicht von der
    Wirklichkeit abweichen -- er ist die Wirklichkeit.
    """
    kind = anchor["kind"]
    if kind == "fountain":
        row = unique(FOUNTAIN_BY_ID, anchor["id"], "Trinkbrunnen")
        if row["brunnenart"] != "Trinkbrunnen":
            die(f"Brunnen {anchor['id']} ist kein Trinkbrunnen ({row['brunnenart']})")
        if row["in_betrieb"] == "false" or row["trinkwasser"] != "true":
            die(f"Brunnen {anchor['id']} liefert laut Datensatz kein Trinkwasser")
        return float(row["lat"]), float(row["lon"]), row
    if kind == "tree":
        row = unique(TREE_BY_KEY, (anchor["area"], anchor["no"]), "Baum")
        for field, expected in anchor.get("expect", {}).items():
            if row[field] != expected:
                die(f"Baum {anchor} : {field} ist {row[field]!r}, erwartet {expected!r}")
        return float(row["lat"]), float(row["lon"]), row
    if kind == "hotspot":
        row = unique(HOTSPOT_BY_NAME, anchor["name"], "Hotspot")
        return float(row["lat"]), float(row["lon"]), row
    if kind == "defi":
        row = unique(DEFI_BY_KEY, (anchor["address"], anchor["spot"]), "Defibrillator")
        return float(row["lat"]), float(row["lon"]), row
    if kind == "venue":
        row = unique(VENUE_BY_NAME, anchor["name"], "Spielort")
        return float(row["lat"]), float(row["lon"]), row
    die(f"unbekannte Ankerart {kind!r}")



def _join(parts: list[str]) -> str:
    """Setzt nur die Satzteile zusammen, die auch einen Wert haben."""
    return " ".join(p for p in parts if p)


# Werte, die im Datensatz stehen, aber nichts aussagen. Sie duerfen nicht als
# Fakt in die App durchrutschen ("In Betrieb keine Angabe.").
_NO_VALUE = {"", "-", "--", "keine angabe", "unbekannt", "n/a", "null", "0"}


def _val(row: dict, key: str) -> str:
    value = (row.get(key) or "").strip()
    return "" if value.lower() in _NO_VALUE else value


def fact_for(kind: str, row: dict) -> str:
    """Der Satz, den die App nach dem Besuch freischaltet.

    Ausschliesslich aus Spalten des jeweiligen Datensatzes formatiert. Leere
    Spalten fallen weg, statt ein "None" in den Text zu schreiben.
    """
    if kind == "fountain":
        bauart, ort = _val(row, "bauart"), _val(row, "aufstellungsort")
        zeit = _val(row, "betriebszeit")
        return _join([
            f"Im Trinkbrunnen-Kataster als {bauart} geführt." if bauart else "",
            f"Aufstellungsort: {ort}." if ort else "",
            f"In Betrieb {zeit}." if zeit else "",
        ])
    if kind == "tree":
        name, gattung, art = _val(row, "NameDeutsch"), _val(row, "Gattung"), _val(row, "Art")
        hoehe, krone = _val(row, "Hoehe"), _val(row, "Schirmdurchmesser")
        umfang = _val(row, "Stammumfang")
        return _join([
            f"Baumkataster: {name} ({gattung} {art})." if name else "",
            f"{hoehe} m hoch," if hoehe else "",
            f"Krone {krone} m," if krone else "",
            f"Stammumfang {umfang} cm." if umfang else "",
        ])
    if kind == "hotspot":
        name, strasse = _val(row, "name"), _val(row, "strasse")
        seit = _val(row, "start_jahr")
        return _join([
            f"Freier Hotspot der Stadt Linz: {name}." if name else "",
            f"Adresse {strasse}." if strasse else "",
            f"In Betrieb seit {seit}." if seit else "",
        ])
    if kind == "defi":
        firma, marke = _val(row, "FIRMA"), _val(row, "Marke/Hersteller")
        spot, adresse = _val(row, "Standort"), _val(row, "Adresse")
        return _join([
            f"Defibrillator {marke}," if marke else "Defibrillator,",
            f"betrieben von {firma}." if firma else "",
            f"Genauer Standort: {spot}." if spot else "",
            f"Adresse {adresse}." if adresse else "",
        ])
    if kind == "venue":
        name, area, typ = _val(row, "name"), _val(row, "area"), _val(row, "type")
        return _join([
            f"Festival-Spielort {name}." if name else "",
            f"Bereich {area}." if area else "",
            f"Als {typ} geführt." if typ else "",
        ])
    die(f"kein Fakt-Bauplan für Ankerart {kind!r}")


# --------------------------------------------------------------------------
# Kuratierte Quests. Reihenfolge = Reihenfolge in der App.
# --------------------------------------------------------------------------

PHOTO = [
    # --- Trinkbrunnen: Kuehlwasser ---------------------------------------
    dict(
        id="p1", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Hauptplatz, südliche Grüninsel",
        location="Trinkbrunnen TB74",
        desc="Steh am Brunnen und prüf selbst nach, ob wirklich Trinkwasser läuft — der Datensatz behauptet es.",
        teaser="Der Hauptplatz führt den meistgenutzten Hotspot der Stadt. Den Brunnen daneben kennt fast niemand.", waterLiters=6.4,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB74"),
    ),
    dict(
        id="p2", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Herbert-Bayer-Platz",
        location="Trinkbrunnen TB72, Prunerstraße",
        desc="Finde den Auslauf und sieh nach, welche Bauart hier tatsächlich steht.",
        teaser="Drei Minuten vom OK Quarter. Eine Frage weniger an die Maschine.", waterLiters=5.1,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB72"),
    ),
    dict(
        id="p3", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Spielplatz Prunerstift",
        location="Trinkbrunnen TB26, hinter der Musikschule",
        desc="Der Brunnen hinter der Musikschule wird von Hand bedient. Probier aus, ob er noch geht.",
        teaser="Zwischen Datensatz und Wirklichkeit liegen hier ein paar Züge am Hebel.", waterLiters=4.8,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB26"),
    ),
    dict(
        id="p4", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Park Hessenplatz",
        location="Trinkbrunnen TB82, beim Kiosk",
        desc="Sieh nach, ob der Brunnen beim Kiosk noch dort steht, wo ihn die Stadt kartiert hat.",
        teaser="Der südlichste Punkt der Runde, weiter weg vom Festival als alles andere.", waterLiters=7.2,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB82"),
    ),
    dict(
        id="p5", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Stadtpark",
        location="Trinkbrunnen TB57, gegenüber Huemerstraße 3",
        desc="Steh vor dem Brunnen und lies die Betriebszeit ab. Stimmt sie mit dem Datensatz überein?",
        teaser="Schatten und Wasser, und niemand, der dir den Weg vorschlägt.", waterLiters=5.6,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB57"),
    ),
    dict(
        id="p6", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Volksgarten Wasserspielplatz",
        location="Trinkbrunnen TB77",
        desc="Such den Auslauf am Wasserspielplatz und sieh dir an, wie er wirklich gebaut ist.",
        teaser="Der Datensatz nennt die Bauart. Ob sie noch stimmt, siehst nur du.", waterLiters=8.0,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB77"),
    ),
    dict(
        id="p7", type="water", symbol="drop.fill", badge="Trinkwasser",
        title="Donaupark hinter dem Parkbad",
        location="Trinkbrunnen TB27",
        desc="Hinter dem Parkbad Richtung Donau. Finde ihn ohne Navigation.",
        teaser="Der Weg dorthin ist die Übung, nicht das Ziel.", waterLiters=7.5,
        source="Trinkbrunnen Linz",
        anchor=dict(kind="fountain", id="TB27"),
    ),
    # --- Baumkataster: CO2-Ausgleich --------------------------------------
    dict(
        id="p8", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Weiß-Tanne, 30 Meter",
        location="Donaupark, Untere Donaulände",
        desc="Stell dich unter die Tanne und schätz die Höhe, bevor du den Wert freischaltest.",
        teaser="Dreißig Meter, gewachsen ohne einen einzigen Trainingslauf.", waterLiters=2.0,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="88", no="003",
                    expect={"NameDeutsch": "Weiß-Tanne", "Hoehe": "30"}),
        records=[("Hoehe", 900, "höchster Baum im Festivalviertel")],
    ),
    dict(
        id="p22", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Stiel-Eiche am Bauernberg",
        location="Bauernberg, Baum #049",
        desc="Geh einmal um den Stamm herum und schätz den Umfang, bevor du nachsiehst.",
        teaser="Der Bauernberg liegt am Rand der Runde. Genau deshalb war dort noch niemand.", waterLiters=3.0,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="1069", no="049",
                    expect={"NameDeutsch": "Stiel-Eiche", "Hoehe": "35", "Schirmdurchmesser": "30"}),
        records=[("Hoehe", MAX_QUEST_DISTANCE_M, "höchster Baum im Spielgebiet"),
                 ("Schirmdurchmesser", MAX_QUEST_DISTANCE_M, "breiteste Krone im Spielgebiet")],
    ),
    dict(
        id="p9", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Ahornblättrige Platane",
        location="Promenade, Baum #034",
        desc="Such an der Promenade den Baum mit der abblätternden Rinde und prüf die Art.",
        teaser="Platanen werfen ihre Rinde ab. Das sieht man im Vorbeigehen — wenn man hinsieht.", waterLiters=2.5,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="475", no="034",
                    expect={"NameDeutsch": "Ahornblättrige-Platane", "Schirmdurchmesser": "16"}),
    ),
    dict(
        id="p10", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Gemeine Rosskastanie",
        location="Promenade, Baum #044",
        desc="Sieh dir die Blätter an: fünf bis sieben Finger an einem Stiel. Passt das zur Art im Kataster?",
        teaser="Ein paar Schritte neben der Platane. Zwei Arten, ein Blick.", waterLiters=2.4,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="475", no="044",
                    expect={"NameDeutsch": "Gemeine Rosskastanie", "Schirmdurchmesser": "22"}),
    ),
    dict(
        id="p23", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Platane im Volksgarten",
        location="Volksgarten, Baum #123",
        desc="Miss die Krone mit den Augen aus und vergleich danach mit dem Katasterwert.",
        teaser="Der Volksgarten hat mehr Bestand, als man beim Durchgehen mitbekommt.", waterLiters=2.7,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="754", no="123",
                    expect={"NameDeutsch": "Ahornblättrige-Platane", "Schirmdurchmesser": "26"}),
    ),
    dict(
        id="p11", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Linde an der Promenade",
        location="Promenade, Baum #049",
        desc="Linden riecht man im Sommer, bevor man sie sieht. Finde diese hier.",
        teaser="Die Winter-Linde ist der häufigste Baum in Linz. Diese ist eine von vielen.", waterLiters=2.2,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="475", no="049",
                    expect={"NameDeutsch": "Linde", "Hoehe": "27"}),
    ),
    dict(
        id="p12", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Platane im Stadtpark",
        location="Stadtpark, Baum #070",
        desc="Der Stamm ist ungewöhnlich stark. Leg die Arme an und schätz, bevor du nachliest.",
        teaser="Über vier Meter Umfang. Kein Serverschrank ist so breit.", waterLiters=2.6,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="319", no="070",
                    expect={"NameDeutsch": "Ahornblättrige-Platane", "Stammumfang": "413"}),
    ),
    dict(
        id="p13", type="tree", symbol="leaf.fill", badge="Baumkataster",
        title="Stiel-Eiche am Tummelplatz",
        location="Tummelplatz, Baum #002",
        desc="Stell dich unter die Krone und schau, wie weit sie reicht.",
        teaser="Zwanzig Meter Krone, gewachsen in etwa hundert Jahren.", waterLiters=2.3,
        source="Baumkataster Linz",
        anchor=dict(kind="tree", area="475", no="002",
                    expect={"NameDeutsch": "Stiel-Eiche", "Schirmdurchmesser": "20"}),
    ),
    # --- Festival-Spielorte: Trainingsdaten -------------------------------
    dict(
        id="p14", type="venue", symbol="building.2.fill", badge="Spielort",
        title="Nordico Stadtmuseum",
        location="Festival-Spielort, OK Quarter",
        desc="Steh vor dem Eingang und ordne den Ort selbst einem Festivalbereich zu.",
        teaser="Einer von 156 Orten im Festivalexport. Diesen hier kannst du anfassen.", waterLiters=3.4,
        source="Ars Electronica Festival 2026",
        anchor=dict(kind="venue", name="Nordico Stadtmuseum Linz"),
    ),
    dict(
        id="p15", type="venue", symbol="building.2.fill", badge="Spielort",
        title="OK Linz",
        location="Festival-Spielort, OK-Platz",
        desc="Geh auf den OK-Platz und prüf, ob der Spielort so heißt, wie der Export ihn führt.",
        teaser="Das Zentrum des Festivals. Und ein Datenpunkt unter 886 Projekten.", waterLiters=3.6,
        source="Ars Electronica Festival 2026",
        anchor=dict(kind="venue", name="OK Linz"),
    ),
    dict(
        id="p16", type="venue", symbol="building.2.fill", badge="Spielort",
        title="Kunstuniversität, Domgasse 1",
        location="Festival-Spielort, Danube Triangle",
        desc="Domgasse 1. Sieh nach, ob der Ort drinnen oder im Freien liegt.",
        teaser="Hier entsteht ein Teil dessen, was anderswo als Trainingsmaterial endet.", waterLiters=3.2,
        source="Ars Electronica Festival 2026",
        anchor=dict(kind="venue", name="University of Arts Linz, Domgasse 1"),
    ),
    dict(
        id="p17", type="venue", symbol="building.2.fill", badge="Spielort",
        title="Francisco Carolinum",
        location="Festival-Spielort, OK Quarter",
        desc="Finde den Eingang und ordne den Ort einem Festivalbereich zu, bevor du nachliest.",
        teaser="Jahrhunderte Kunst an einer Adresse, die in einer Tabelle eine Zeile belegt.", waterLiters=3.3,
        source="Ars Electronica Festival 2026",
        anchor=dict(kind="venue", name="Francisco Carolinum Linz"),
    ),
    # --- Defibrillatoren am Spielort: Notstrom ----------------------------
    dict(
        id="p18", type="power", symbol="bolt.heart.fill", badge="Notfallnetz",
        title="Defibrillator im Nordico",
        location="Infopoint/Kasse, Dametzstraße 23",
        desc="Am Infopoint hängt ein Defibrillator. Finde ihn und merk dir, wo genau.",
        teaser="282 Geräte sind in Linz kartiert. Eines steht dort, wo du gerade stehst.", waterLiters=1.8,
        source="Defibrillatoren Linz × Festival-Spielorte",
        anchor=dict(kind="defi", address="Dametzstraße 23", spot="Nordico Infopoint/Kasse"),
    ),
    dict(
        id="p19", type="power", symbol="bolt.heart.fill", badge="Notfallnetz",
        title="Defibrillator im OK Kulturquartier",
        location="Infopoint, OK-Platz 1",
        desc="Such das Gerät am Infopoint und prüf die Standortangabe aus dem Datensatz.",
        teaser="Ein Datensatz, der im Ernstfall zählt. Deshalb lohnt es, ihn selbst zu kennen.", waterLiters=1.8,
        source="Defibrillatoren Linz × Festival-Spielorte",
        anchor=dict(kind="defi", address="OK-Platz 1", spot="OK OÖ Kulturquartier Infopoint"),
    ),
    # --- Hotspots: Bandbreite ---------------------------------------------
    dict(
        id="p20", type="wifi", symbol="wifi", badge="Freies WLAN",
        title="Hotspot Taubenmarkt",
        location="Öffentliches WLAN, Taubenmarkt",
        desc="Stell dich in die Mitte und sieh nach, ob das freie Netz wirklich auftaucht.",
        teaser="Gratis-WLAN seit Jahren. Die Stadt führt Buch darüber, wie viele es nutzen.", waterLiters=2.8,
        source="Hotspot-Nutzung Linz",
        anchor=dict(kind="hotspot", name="Taubenmarkt"),
    ),
    dict(
        id="p21", type="wifi", symbol="wifi", badge="Freies WLAN",
        title="Hotspot Hauptplatz",
        location="Öffentliches WLAN, Hauptplatz",
        desc="Der meistgenutzte Hotspot der Stadt. Prüf selbst, ob er hält, was die Zahlen sagen.",
        teaser="Zehntausende Verbindungen im Jahr. Deine wäre eine davon — oder eben nicht.", waterLiters=3.0,
        source="Hotspot-Nutzung Linz",
        anchor=dict(kind="hotspot", name="Hauptplatz"),
    ),
]

# Fakt oder Slop. Jede wahre Aussage ist eine oben nachgerechnete Kennzahl,
# jede falsche erklaert in `explanation`, was tatsaechlich im Datensatz steht.
TRIVIA = [
    dict(
        id="t1",
        statement="Der Linzer Baumkataster erfasst über 27.000 einzelne Bäume — mit Höhe, Stammumfang und Kronendurchmesser.",
        isFact=True,
        explanation="27.004 Bäume, 773 unterschiedene Arten. Offener Datensatz der Stadt Linz.",
    ),
    dict(
        id="t2",
        statement="Der häufigste Baum in Linz ist die Winter-Linde.",
        isFact=True,
        explanation="1.651 Winter-Linden, vor Spitz-Ahorn (1.398) und Stiel-Eiche (1.329).",
    ),
    dict(
        id="t3",
        statement="Für jeden Baum im Kataster hält die Stadt Linz auch die jährlich gebundene CO₂-Menge fest.",
        isFact=False,
        explanation="Slop. Der Datensatz führt Höhe, Schirmdurchmesser und Stammumfang — kein CO₂.",
    ),
    dict(
        id="t4",
        statement="Beim Ars Electronica Festival 2026 sind 886 Projekte und 779 Programmslots erfasst.",
        isFact=True,
        explanation="Genau so steht es im offiziellen Festival-Export, dazu 156 Orte und 511 Kontakte.",
    ),
    dict(
        id="t5",
        statement="Am Festival 2026 sind Künstler:innen aus 78 Ländern beteiligt.",
        isFact=True,
        explanation="78 Länderkürzel im Artists-Feld. Österreich führt mit 478 Nennungen, dann Deutschland mit 193.",
    ),
    dict(
        id="t6",
        statement="Das Ars Electronica Futurelab ist mit 21 Projekten der meistvertretene Beitragende des Festivals.",
        isFact=True,
        explanation="21 Projekte, vor Ars Electronica selbst (12) und Ars Electronica Solutions (11).",
    ),
    dict(
        id="t7",
        statement="Das Festival 2026 hat erstmals eine eigene Programmkategorie „Prompt Battle“.",
        isFact=False,
        explanation="Slop. Es gibt 20 Kategorien, die größte ist schlicht „Project“ mit 332 Einträgen.",
    ),
    dict(
        id="t8",
        statement="Im Linzer Brunnen-Datensatz sind 80 Anlagen ausdrücklich als Trinkbrunnen geführt.",
        isFact=True,
        explanation="80 von 132 Brunnen. Der Rest sind Zierbrunnen, Bachläufe und Wattrinnen.",
    ),
    dict(
        id="t9",
        statement="Jeder Linzer Trinkbrunnen meldet seine Durchflussmenge live an die Stadt.",
        isFact=False,
        explanation="Slop. Der Datensatz ist ein statischer Anlagenstand — Bauart, Steuerung, Betriebszeit.",
    ),
    dict(
        id="t10",
        statement="Von 1.211 Linzer Straßennamen sind 399 nach Männern benannt und nur 53 nach Frauen.",
        isFact=True,
        explanation="Steht im Straßennamen-Datensatz. Häufigster Beruf dahinter: Politiker, 57-mal.",
    ),
    dict(
        id="t11",
        statement="Am Linzer Hauptplatz ist das freie WLAN der Stadt aus Sicherheitsgründen abgeschaltet.",
        isFact=False,
        explanation="Slop. Der Hauptplatz betreibt den meistgenutzten Hotspot der ganzen Stadt.",
    ),
    dict(
        id="t12",
        statement="Ein Linzer Rechenzentrum wird offiziell mit Wasser aus dem Volksgarten-Brunnen gekühlt.",
        isFact=False,
        explanation="Slop. TB77 im Volksgarten ist ein Trinkbrunnen mit Bogenauslauf, sonst nichts.",
    ),
    dict(
        id="t13",
        statement="Linz betreibt 20 öffentliche Beerenhecken, aus denen jede und jeder ernten darf.",
        isFact=True,
        explanation="„Hecken die schmecken“: 20 Standorte mit Ribisel, Himbeere, Josta und Dirndl.",
    ),
    dict(
        id="t14",
        statement="Von den 68 öffentlichen WC-Anlagen der Stadt haben 21 einen Wickeltisch.",
        isFact=True,
        explanation="21 mit Wickeltisch, 37 barrierefrei. Steht so im WC-Datensatz.",
    ),
    dict(
        id="t15",
        statement="Die Radverkehrs-Zählstellen der Stadt erfassen auch, wie viele Menschen zu Fuß über den Hauptplatz gehen.",
        isFact=False,
        explanation="Slop. Die Zählstellen zählen Radfahrten. Fußgänger:innen kommen darin nicht vor.",
    ),
    dict(
        id="t16",
        statement="Im Festivalprogramm stehen 43 Beiträge, die komplett ohne Sprache auskommen.",
        isFact=True,
        explanation="43-mal ist als Sprache „nonverbal“ hinterlegt. Klingt erfunden, steht aber im Export.",
    ),
]


# --------------------------------------------------------------------------
# Wissensschicht: was man an diesem Ort lernt
# --------------------------------------------------------------------------

# Zusatzquellen, die nur die Detailansicht braucht.
hotspot_usage = read_csv(LINZ / "hotspots" / "Hotspot-Nutzung.csv")
festival = json.loads((ROOT / "data" / "festival" / "ars-festival-2026.json").read_text())

LOC_BY_ID = {loc["id"]: loc for loc in festival["locations"]}

USAGE_BY_SPOT: dict[str, int] = {}
USAGE_YEARS: set[str] = set()
for _row in hotspot_usage:
    USAGE_YEARS.add(_row["jahr"])
    USAGE_BY_SPOT[_row["standort_id"]] = (
        USAGE_BY_SPOT.get(_row["standort_id"], 0) + int(_row["anzahl_clients"] or 0)
    )

# Projekte haengen im Export am Raum, nicht am Gebaeude. Ein Spielort zaehlt
# deshalb nur mit seinen Kindern -- sonst steht am Ars Electronica Center eine
# Eins, waehrend 137 Projekte darin stattfinden.
PROJECTS_AT: dict[str, int] = {}
SLOTS_AT: dict[str, int] = {}
for _p in festival["projects"]:
    for _lid in _p.get("Linked Location") or ():
        PROJECTS_AT[_lid] = PROJECTS_AT.get(_lid, 0) + 1
        SLOTS_AT[_lid] = SLOTS_AT.get(_lid, 0) + len(_p.get("calendar_ids") or ())


def location_family(loc_id: str, seen: set[str] | None = None) -> set[str]:
    """Ein Spielort und alle Raeume darunter, zyklensicher."""
    seen = set() if seen is None else seen
    if loc_id in seen:
        return seen
    seen.add(loc_id)
    for child in (LOC_BY_ID.get(loc_id, {}).get("Linked Child") or ()):
        location_family(child, seen)
    return seen


# Kennzahlen der Datensaetze, einmal beim Build gezaehlt statt im Text behauptet.
TREE_TOTAL = len(trees)
TREE_SPECIES = len({r["NameDeutsch"] for r in trees if r["NameDeutsch"]})
FOUNTAIN_DRINKABLE = sum(1 for r in fountains if r["brunnenart"] == "Trinkbrunnen")
FOUNTAIN_TOTAL = len(fountains)
DEFI_TOTAL = len(defis)
HOTSPOT_TOTAL = len(hotspots)
FESTIVAL_LOCATIONS = len(festival["locations"])
FESTIVAL_PROJECTS = len(festival["projects"])


def _int(value: str) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _de(value: int) -> str:
    """Tausenderpunkt wie im Deutschen: 27004 -> 27.004."""
    return f"{value:,}".replace(",", ".")


def stats_for(kind: str, row: dict, anchor: dict) -> list[dict]:
    """Die Zahlen der Detailansicht, ausnahmslos aus der Quellzeile gelesen.

    Anders als `fact_for`, das einen Satz baut, liefert das hier eine Tabelle:
    Label und Wert getrennt, damit die App sie setzen kann, ohne im Text zu
    suchen. Leere Spalten fallen weg statt als Strich zu erscheinen.
    """
    out: list[tuple[str, str]] = []

    if kind == "fountain":
        out += [
            ("Bauart", _val(row, "bauart")),
            ("Aufstellungsort", _val(row, "aufstellungsort")),
            ("Betriebszeit", _val(row, "betriebszeit")),
            ("Trinkwasser", "ja" if row["trinkwasser"] == "true" else ""),
            ("Trinkbrunnen in Linz", f"{FOUNTAIN_DRINKABLE} von {FOUNTAIN_TOTAL} Anlagen"),
        ]
    elif kind == "tree":
        hoehe, krone = _val(row, "Hoehe"), _val(row, "Schirmdurchmesser")
        umfang = _val(row, "Stammumfang")
        gattung, art = _val(row, "Gattung"), _val(row, "Art")
        hoehe_val = _int(hoehe)
        taller = (
            sum(1 for r in trees if (_int(r["Hoehe"]) or 0) > hoehe_val)
            if hoehe_val
            else None
        )
        out += [
            ("Botanisch", f"{gattung} {art}".strip()),
            ("Höhe", f"{hoehe} m" if hoehe else ""),
            ("Krone", f"{krone} m" if krone else ""),
            ("Stammumfang", f"{umfang} cm" if umfang else ""),
            (
                "Höher in Linz",
                f"{_de(taller)} von {_de(TREE_TOTAL)} Bäumen" if taller is not None else "",
            ),
        ]
    elif kind == "hotspot":
        clients = USAGE_BY_SPOT.get(row["id"])
        year = max(USAGE_YEARS) if USAGE_YEARS else ""
        out += [
            ("Adresse", _val(row, "strasse")),
            ("In Betrieb seit", _val(row, "start_jahr")),
            (
                f"Verbindungen {year}",
                _de(clients) if clients else "",
            ),
            ("Hotspots in Linz", f"{HOTSPOT_TOTAL} Standorte"),
        ]
    elif kind == "defi":
        out += [
            ("Betreiber", _val(row, "FIRMA")),
            ("Gerät", _val(row, "Marke/Hersteller")),
            ("Genauer Standort", _val(row, "Standort")),
            ("Geräte in Linz", f"{DEFI_TOTAL} kartiert"),
        ]
    elif kind == "venue":
        loc = unique(VENUE_BY_NAME, anchor["name"], "Spielort")
        family = location_family(loc["id"])
        rooms = len(family) - 1
        projects = sum(PROJECTS_AT.get(i, 0) for i in family)
        slots = sum(SLOTS_AT.get(i, 0) for i in family)
        area = (LOC_BY_ID.get(loc["id"], {}).get("Area") or "").strip()
        out += [
            ("Festivalbereich", area.title() if area else ""),
            ("Räume im Export", str(rooms) if rooms else ""),
            ("Projekte hier", str(projects) if projects else ""),
            ("Programmslots", str(slots) if slots else ""),
            ("Orte im Export", f"{FESTIVAL_LOCATIONS} insgesamt"),
        ]
    else:
        die(f"kein Kennzahlen-Bauplan für Ankerart {kind!r}")

    return [{"label": label, "value": value} for label, value in out if value]


# Der Wissenstext der Detailansicht. Bewusst ohne Zahlenmaterial -- Zahlen
# stehen in `stats` und werden beim Build aus der Quellzeile gezogen, damit
# sie nicht veralten koennen. Hier steht nur, warum Ort und Datensatz
# zusammengehoeren: das, was die Maschine einem sonst zusammenfassen wuerde.
INFO = {
    "p1": "Die Stadt führt jede öffentliche Brunnenanlage mit Bauart, Aufstellungsort und "
          "Betriebszeit. Nur ein Teil davon gibt Trinkwasser ab, der Rest ist Zierbrunnen — "
          "am Becken selbst steht das nirgends, es steht in einer Tabelle. Am Hauptplatz "
          "treffen sich zwei Linzer Datensätze auf wenigen Metern: der meistgenutzte "
          "WLAN-Hotspot der Stadt und ein Auslauf, an dem Wasser gratis ist.",
    "p2": "Der Platz trägt den Namen von Herbert Bayer, dem oberösterreichischen "
          "Bauhaus-Grafiker, der die serifenlose Kleinschreibung zur Haltung erklärte. "
          "Linz veröffentlicht seine Straßennamen als Datensatz samt Benennungsanlass — "
          "und die Verteilung darin ist selbst eine Aussage darüber, wessen Namen eine "
          "Stadt in den Stadtplan schreibt.",
    "p3": "Brunnen an Spielplätzen führt der Kataster gesondert, weil an ihnen gespielt "
          "und getrunken wird. Der Datensatz unterscheidet dafür Brunnenart und Bauart: "
          "ob überhaupt Trinkwasser fließt, und in welcher Form es herauskommt. Beides "
          "lässt sich nur vor Ort gegenprüfen.",
    "p4": "Der Park am Hessenplatz liegt im Gründerzeitviertel, wo Linz am dichtesten bebaut "
          "ist — öffentliches Wasser ist hier keine Zierde, sondern Infrastruktur. Der "
          "Kataster hält fest, in welchem Zeitraum eine Anlage läuft: Brunnen sind nicht "
          "ganzjährig in Betrieb, im Winter werden die Wasserzähler ausgebaut.",
    "p5": "Der Stadtpark gehört zum Grüngürtel entlang der Bahn und taucht gleich in zwei "
          "Katastern auf: als Standort einer Brunnenanlage und mit seinem Baumbestand. "
          "Genau solche Überlappungen machen offene Daten brauchbar — ein Ort, mehrere "
          "unabhängig geführte Tabellen, die sich gegenseitig prüfen lassen.",
    "p6": "Der Volksgarten ist die älteste öffentliche Parkanlage der Stadt und trägt einen "
          "Wasserspielplatz, also Wasser, das ausdrücklich zum Anfassen da ist. Während "
          "Rechenzentren Kühlwasser verdampfen, das niemand je sieht, ist hier jeder Liter "
          "öffentlich, sichtbar und kostenlos.",
    "p7": "Der Donaupark zieht sich als Band zwischen Lände und Fluss und ist der Teil von "
          "Linz, in dem Festivalbetrieb und Alltagsstadt am dichtesten aneinanderliegen. "
          "Der Brunnen dahinter ist ein Eintrag in einer Tabelle, die sonst niemand liest — "
          "bis man ihn braucht.",
    "p8": "Der Linzer Baumkataster ist einer der ausführlichsten offenen Datensätze der "
          "Stadt: jeder Baum mit Gattung, Art, Höhe, Kronendurchmesser und Stammumfang. "
          "Weiß-Tannen werden in Mitteleuropa höher als jede andere heimische Baumart, und "
          "dieser Bestand steht mitten im Festivalgebiet — gewachsen über Jahrzehnte, "
          "vermessen in einer Zeile.",
    "p9": "Platanen werfen ihre Rinde in Platten ab; darunter kommt helles Holz zum "
          "Vorschein, weshalb der Stamm gescheckt aussieht. Der Kataster nennt dafür den "
          "Stammumfang in Zentimetern — gemessen, nicht geschätzt. Wer den Baum umrundet, "
          "hat die Zahl vor dem Nachlesen im Gefühl.",
    "p10": "Die Rosskastanie stammt vom Balkan und steht in Mitteleuropa fast ausschließlich "
           "dort, wo Menschen sie gepflanzt haben — Alleen, Gasthausgärten, Parks. Sie ist "
           "damit ein Datenpunkt über Stadtgeschichte, nicht über Natur.",
    "p11": "Linden gehören zu den häufigsten Straßenbäumen der Stadt, und das ist im Kataster "
           "nachzählbar. Dass ein einzelner Baum nichts Besonderes ist, ist hier die Pointe: "
           "erst die Menge macht den Bestand — und erst der Datensatz macht die Menge "
           "sichtbar.",
    "p12": "Der Stadtpark trägt alten Bestand, den der Kataster mit Höhe und "
           "Schirmdurchmesser führt. Der Schirmdurchmesser ist die Zahl, die im Sommer "
           "zählt: er bestimmt, wie viel Fläche beschattet wird und wie stark der Boden "
           "darunter abkühlt.",
    "p13": "Der Tummelplatz war im 19. Jahrhundert Exerzierfläche, heute ist er Park — die "
           "Eichen darauf sind älter als jede Nutzung, die man ihnen zuschreibt. "
           "Stiel-Eichen gehören zu den langlebigsten Bäumen Mitteleuropas.",
    "p14": "Das Nordico ist das Stadtmuseum von Linz und im Festivalexport als eigener "
           "Spielort geführt. Der Export ordnet jeden Ort einem Festivalbereich zu und "
           "verschachtelt Gebäude und Räume — deshalb hängen Projekte selten am Haus, "
           "sondern am Saal darin.",
    "p15": "Das OK ist seit Jahrzehnten das Haus für Medienkunst in Linz und während des "
           "Festivals einer der dichtesten Spielorte überhaupt. Im Export ist es kein "
           "einzelner Eintrag, sondern eine Familie aus Gebäude und Räumen, über die sich "
           "Projekte und Programmslots verteilen.",
    "p16": "An der Kunstuniversität entsteht ein Teil dessen, was anderswo als "
           "Trainingsmaterial endet. Der Festivalexport führt den Ort mit Adresse, Bereich "
           "und Typ, sagt aber nichts darüber, was drinnen passiert — diese Lücke schließt "
           "nur, wer hingeht.",
    "p17": "Das Francisco Carolinum ist das älteste Museum Oberösterreichs und zeigt während "
           "des Festivals zeitgenössische Medienkunst in historischen Räumen. Im Export "
           "hängt daran eine der größeren Programmfamilien des OK Quarter.",
    "p18": "Die Stadt veröffentlicht die Standorte ihrer öffentlich zugänglichen "
           "Defibrillatoren mit Betreiber, Gerätetyp und Stockwerk. Dass ein Festivalort "
           "zugleich ein Eintrag in diesem Datensatz ist, sieht man erst, wenn man beide "
           "Tabellen übereinanderlegt — und im Ernstfall zählt genau das.",
    "p19": "Ein Defibrillator ist nur so gut wie das Wissen darum, wo er hängt. Der Datensatz "
           "nennt das Stockwerk und den Raum, aber keine Öffnungszeit — ob das Gerät nachts "
           "erreichbar ist, steht nirgends. Solche Lücken findet man nur vor Ort.",
    "p20": "Der Taubenmarkt ist einer der ältesten Hotspot-Standorte der Stadt und meldet "
           "seine Nutzung monatlich an den offenen Datensatz. Gezählt werden Verbindungen, "
           "nicht Menschen — wer zweimal am Tag vorbeigeht, steht zweimal in der Statistik.",
    "p21": "Der Hauptplatz-Hotspot ist der meistgenutzte der Stadt, und das lässt sich in der "
           "Nutzungstabelle nachzählen. Das freie Netz der Stadt und die Frage, wie viel "
           "Wasser eine KI-Abfrage kostet, hängen direkt zusammen: die Verbindung ist "
           "gratis, die Antwort dahinter nicht.",
    "p22": "Der Bauernberg ist die Geländekante zwischen Innenstadt und Froschberg, und sein "
           "Baumbestand ist entsprechend alt. Der Kataster lässt sich nach Höhe sortieren — "
           "dieser Baum steht dabei sehr weit vorn, und das ist nachgerechnet, nicht "
           "behauptet.",
    "p23": "Im Volksgarten stehen Bäume, die älter sind als die Anlage in ihrer heutigen "
           "Form. Der Kataster führt sie mit denselben vier Maßen wie jeden Straßenbaum am "
           "Stadtrand — die Tabelle macht keinen Unterschied zwischen Schaustück und "
           "Bestand.",
}

# Fakt oder Slop wird nicht mehr am Stueck gespielt, sondern haengt an
# einzelnen Orten. Die Zuordnung ist thematisch: die Aussage gehoert zu dem
# Datensatz, in dem man gerade steht. Zwoelf der 23 Orte haben keine -- sonst
# wird aus der Belohnung eine Pflichtuebung.
TRIVIA_FOR = {
    "p1": ["t8", "t9"],
    "p2": ["t10"],
    "p4": ["t13"],
    "p6": ["t12"],
    "p7": ["t14"],
    "p8": ["t1", "t3"],
    "p11": ["t2"],
    "p14": ["t5", "t16"],
    "p15": ["t4", "t7"],
    "p17": ["t6"],
    "p21": ["t11", "t15"],
}


# --------------------------------------------------------------------------
# Aufloesen und schreiben
# --------------------------------------------------------------------------

def main() -> None:
    photo_out = []
    seen_ids = set()
    for quest in PHOTO:
        anchor = quest["anchor"]
        lat, lon, row = resolve(anchor)
        fact = fact_for(anchor["kind"], row)
        if not fact:
            die(f"{quest['id']}: Datensatz gibt keinen Fakt her")
        distance = meters(lat, lon, FESTIVAL_LAT, FESTIVAL_LON)
        if distance > MAX_QUEST_DISTANCE_M:
            die(f"{quest['id']} liegt {distance:.0f} m vom Festival entfernt, zu weit zum Gehen")
        if quest["id"] in seen_ids:
            die(f"doppelte Quest-ID {quest['id']}")
        seen_ids.add(quest["id"])
        for field, radius, claim in quest.get("records", ()):
            assert_no_larger(anchor, field, radius, f"{quest['id']} ({claim})")

        info = INFO.get(quest["id"])
        if not info:
            die(f"{quest['id']}: kein Wissenstext in INFO")
        stats = stats_for(anchor["kind"], row, anchor)
        if len(stats) < 2:
            die(f"{quest['id']}: Datensatz gibt nur {len(stats)} Kennzahlen her")

        photo_out.append({
            "id": quest["id"],
            "type": quest["type"],
            "symbol": quest["symbol"],
            "badge": quest["badge"],
            "title": quest["title"],
            "location": quest["location"],
            "desc": quest["desc"],
            "teaser": quest["teaser"],
            "fact": fact,
            "info": info,
            "stats": stats,
            "triviaIds": TRIVIA_FOR.get(quest["id"], []),
            "waterLiters": quest["waterLiters"],
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "source": quest["source"],
        })

    trivia_out = []
    for item in TRIVIA:
        if item["id"] in seen_ids:
            die(f"doppelte Quest-ID {item['id']}")
        seen_ids.add(item["id"])
        trivia_out.append({
            "id": item["id"],
            "statement": item["statement"],
            "isFact": item["isFact"],
            "explanation": item["explanation"],
        })

    # Jede Zuordnung muss auf eine Aussage zeigen, die es auch gibt, und jede
    # Aussage genau einmal verwendet werden -- sonst liegt Inhalt brach.
    trivia_ids = {t["id"] for t in trivia_out}
    used: list[str] = []
    for quest_id, ids in TRIVIA_FOR.items():
        if quest_id not in seen_ids:
            die(f"TRIVIA_FOR verweist auf unbekannte Quest {quest_id}")
        for trivia_id in ids:
            if trivia_id not in trivia_ids:
                die(f"{quest_id}: Aussage {trivia_id} existiert nicht")
            used.append(trivia_id)
    if len(used) != len(set(used)):
        die("eine Aussage haengt an mehreren Orten")
    unused = trivia_ids - set(used)
    if unused:
        die(f"nicht zugeordnete Aussagen: {sorted(unused)}")

    facts = sum(1 for t in trivia_out if t["isFact"])
    OUT.write_text(
        json.dumps({"photoQuests": photo_out, "triviaQuests": trivia_out},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    by_type = Counter(q["type"] for q in photo_out)
    with_trivia = sum(1 for q in photo_out if q["triviaIds"])
    print(f"{OUT.relative_to(ROOT)}: {len(photo_out)} Foto-Quests {dict(by_type)}, "
          f"{len(trivia_out)} Trivia ({facts} Fakt / {len(trivia_out) - facts} Slop) "
          f"an {with_trivia} Orten")


if __name__ == "__main__":
    main()
