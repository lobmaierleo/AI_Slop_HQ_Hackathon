# Datenkatalog

Zwei Datenwelten. Die Bewertung hängt explizit an der **Qualität ihrer Verbindung** — dieses Dokument ist deshalb nach Verknüpfungspotenzial sortiert, nicht nach Quelle.

## Welt A — Festival 2026

**Datei:** `data/festival/ars-festival-2026.json` (Export vom 2.9.2026, `schema_version` 2.0, Filter `public_for_hackathon = true`)
**Aktualisieren:** `python3 .agents/skills/ars-dataset/scripts/ars_dataset.py download -o data/festival/ars-festival-2026.json`
**Prüfen:** `… verify <datei>` und `… summary <datei>`

Vier verknüpfte Datenbanken:

| DB | Records | Interessante Felder |
|---|---|---|
| `projects` | 886 | `Name DE/EN`, `Category`, `Artists`, `Description DE/EN`, `Language`, `Linked Ticket`, `Curatorial Highlight`, `Max Participants`, `Additional Info` (enthält Barrierefreiheits-Hinweise) |
| `calendar` | 779 | `Time`, `Start/End Time`, `Duration`, `Recommended Arrival`, `Category`, `Highlight` |
| `contacts` | 511 | `Name`, `Category` (Person/Organization/Group), **`Country`** (107 Länder!), `Pronouns`, `Description` |
| `locations` | 156 | `Latitude`/`Longitude`, `Area`, `Type`, `Address`, `Services`, Hierarchie über Parent/Child |

**Join-Regeln (nicht raten, das hier ist geprüft):**
- Schlüssel für alles ist `canonical_id`, nicht `id`.
- Projekt ↔ Zeit: **`calendar["Linked Projects"]` ist maßgeblich** (778/778 auflösbar). Die Rückrichtung `projects.calendar_ids` funktioniert ebenfalls (778/778).
- Projekt ↔ Ort: `projects["Linked Location"]` löst nur **559 von 850** auf. Nicht jedes Projekt hat einen auflösbaren Ort — abfangen, nicht wegraten.
- **`calendar["Linked Location"]` ist kaputt** (0 von 42.790 auflösbar, enthält Notion-URLs statt IDs). Nicht verwenden. Ort immer über das Projekt holen.
- Nach dem Join: 778 Event-Zeilen, davon **736 mit Koordinaten**.

**Größenwarnung:** Die Projektbeschreibungen umfassen zusammen ~708.000 Zeichen (~177k Tokens). Niemals vollständig in ein Kontextfenster laden. Wenn semantisch gearbeitet werden soll: einmalig Embeddings vorberechnen, nach `data/derived/` schreiben (gitignored), zur Laufzeit nur den Index nutzen.

## Welt B — Open Data Linz

**Fallstricke, geprüft am 11.09.2026:**
- **`baumkataster.Stammumfang` hat Ausreißer.** Die Einheit ist cm, aber einzelne Zeilen führen
  unmögliche Werte (Silber-Weide 11.120, Platane 4.205 — das wären 111 bzw. 42 Meter Umfang).
  Superlative auf diesem Feld sind wertlos. `Hoehe` und `Schirmdurchmesser` sind sauber.
- **Superlative im Baumkataster immer an einen Radius binden.** Der höchste Baum im Umkreis von
  900 m ist ein anderer als im Umkreis von 1.400 m. `scripts/build_quests.py` rechnet solche
  Aussagen beim Build nach und bricht ab, wenn sie nicht mehr stimmen.
- **`baumkataster.Flaeche` ist eine numerische Gebiets-ID, kein Ortsname.** `BaumNr` ist nur
  innerhalb einer Fläche eindeutig — als Schlüssel taugt nur das Paar `(Flaeche, BaumNr)`.
- **`trinkbrunnen`: `brunnenart` zählt, nicht `trinkwasser`.** 132 Anlagen, davon 80 echte
  Trinkbrunnen. Zierbrunnen können `trinkwasser == true` tragen und trotzdem keine sein.

**Ort:** `data/linz/<datensatz>/` — übernommen aus dem offiziellen Hackathon-Repo, inklusive der geprüften `README.md` je Datensatz und teilweise `prepare_*.py`-Skripten. Koordinaten sind bereits als `lon`/`lat` (WGS84) aufbereitet; `coordinate_conversion.py` liegt bei, falls EPSG:31255 nachkonvertiert werden muss.

### Lokal vorhanden (13)

| Datensatz | Umfang | Warum interessant |
|---|---|---|
| **`strassennamen`** | 1.211 aktuelle + 364 historische | Der stärkste Datensatz im ganzen Katalog. Felder: `benannt_nach`, `person_name`, `person_geschlecht`, `person_beruf`, `person_wikidata_id`, `jahr_benennung`, `heutiger_strassenname`. **399 Straßen nach Männern, 53 nach Frauen.** Historisch enthalten: `Adolf-Hitler-Platz` und die NS-Umbenennungen 1938–41 samt Rückbenennung. Eine Stadt, die ihre Namen mehrfach neu verhandelt hat. 452 Wikidata-IDs erlauben Anreicherung. |
| `baumkataster` | 27.004 Bäume | `Gattung`, `Art`, `NameDeutsch`, `Hoehe`, `Schirmdurchmesser`, `Stammumfang`, lon/lat. Stand 1.7.2026 |
| `linztermine` | 1,0 MB JSON | Städtische Veranstaltungen — der direkte Gegenspieler zum Festivalprogramm |
| `herkunftslaender-gaeste` | 232 Zeilen | `iso2`, `ankuenfte`, `uebernachtungen` nach Quartal 2024. **`iso2` joint direkt auf `contacts.Country`** des Festivals — die härteste vorhandene Brücke zwischen beiden Welten |
| `hotspots` | 750 Nutzungszeilen | WLAN-Standorte plus monatliche Client-Zahlen 2022 — eine Zeitreihe städtischer Präsenz |
| `trinkbrunnen` | 132 | `trinkwasser` true/false — viele „Brunnen" sind Zierbrunnen ohne Trinkwasser |
| `wc-anlagen` | 68 | `barrierefrei`, `eurokey`, `wickeltisch`, `oeffnungszeiten` |
| `defibrillatoren` | ~350 | Nur für Prototypen freigegeben, nicht als Notfallauskunft ausgeben |
| `hecken-die-schmecken` | klein | Essbare Beerensträucher im Stadtgebiet |
| `hundezonen` | GeoJSON | Verbots-, Auslauf-, Freilaufzonen |
| `kurzparkzonen` | 5 GeoJSON-Layer | Zeit- und Gebührenzonen |
| `baulandreserven-2022` | GeoJSON | Unbebaute Flächen — „was Linz noch werden könnte" |
| `spielplaetze` | nur Doku lokal | Datei muss nachgeladen werden |

### Nur Dokumentation lokal, Abruf nötig (10)

`boudicca-events` (Event-API, OpenAPI 3.1) · `efa-fahrplanauskunft` (Haltestellen/Abfahrten/Routen, Legacy-API) · `luftguete-messwerte` (Live-JSON-API, 24h rollierend, 5 Stationen) · `radverkehr-zaehlstellen` (stündliche Zählungen 2024–25) · `historische-stadtplaene` (1876, 1945 u.a., TIFF+TFW) · `orthofotos` (1988–2023) · `3d-geodaten-lod2-2022` (CityGML) · `linz-ag-linien-2025` · `stadtplan-linz-2025`

Bei diesen zuerst die `README.md` im jeweiligen Ordner lesen — sie enthält Download-Link, Format-Fallstricke und Lizenz. Der Skill `hackathon-datasets` hilft beim Abruf.

## Die vier belastbaren Brücken zwischen A und B

Wer beide Welten wirklich verschränken will, hat vier harte Ansatzpunkte — alles andere ist Dekoration:

1. **Geografisch** — 156 Festival-Locations mit Koordinaten gegen jeden Linzer Geo-Datensatz. Naheliegend, aber schwach: genau das machen die offiziellen Beispiele bereits.
2. **Über Herkunft** — `contacts.Country` (107 Länder, 511 Künstler:innen) joint per ISO-2 auf `herkunftslaender-gaeste`. Wer stellt aus, wer reist an, und wo klafft die Lücke?
3. **Semantisch** — Projektbeschreibungen gegen Straßennamen-Biografien, Baumarten, Ortsbeschreibungen. Verlangt Embeddings, ergibt aber Verbindungen, die niemand von Hand fände.
4. **Zeitlich** — 779 Festival-Zeitslots gegen Linztermine, Hotspot-Nutzung, Luftgüte-Zeitreihen, historische Stadtpläne.
