#!/usr/bin/env python3
"""Handle the Ars Electronica Festival 2026 hackathon dataset. Stdlib only.

CLI:

    python3 ars_dataset.py download [-o FILE]      # fetch latest export (default: notion_export.json)
    python3 ars_dataset.py summary  [FILE_OR_URL]  # counts + data-health metrics
    python3 ars_dataset.py verify   [FILE_OR_URL] [--schema PATH]
                                                   # validate records against the JSON schema
    python3 ars_dataset.py diff OLD.json NEW.json  # what changed between two exports

With no FILE_OR_URL, summary/verify use the live download URL.
`verify` exits 1 if violations are found, `diff` exits 1 if the exports differ.

Importable helpers (they encode the dataset's join and cleansing rules —
see the skill's SKILL.md and references/data-quality.md):

    load, build_indexes, key_of, links, parse_coord, is_public,
    parse_event_datetime, event_rows
"""

import json
import math
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATASET_URL = "https://ars.electronica.art/negotiatinghumanity/hackathondata/"
DATABASES = ("projects", "contacts", "locations", "calendar")
DEFAULT_SCHEMA = Path(__file__).resolve().parent.parent / "references" / "schema.json"
_CANONICAL_ID_RE = re.compile(r"^[0-9a-f]{32}$")
_LEGACY_ID_RE = re.compile(r"[0-9a-f]{32}$")


# ---------------------------------------------------------------- loading

def load(source=DATASET_URL):
    """Load the dataset from a URL or local file path."""
    if str(source).startswith(("http://", "https://")):
        req = urllib.request.Request(source, headers={"User-Agent": "ars-dataset-skill"})
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    with open(source, encoding="utf-8") as f:
        return json.load(f)


def key_of(canonical_id):
    """Return a valid schema-v2 canonical id, or None."""
    if not isinstance(canonical_id, str):
        return None
    return canonical_id if _CANONICAL_ID_RE.fullmatch(canonical_id) else None


def links(record, field):
    """The join keys in a link field, always as a list ([] for null)."""
    return record.get(field) or []


def build_indexes(data):
    """Return ``{database: {canonical_id: record}}`` without mutating data."""
    indexes = {}
    for db in DATABASES:
        idx = {}
        for rec in data.get(db, []):
            key = key_of(rec.get("canonical_id"))
            if key is not None and key not in idx:
                idx[key] = rec
        indexes[db] = idx
    return indexes


# ------------------------------------------------------- cleansing helpers

def _is_finite_number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def parse_coord(value):
    """Convert a schema-v2 numeric coordinate to float, or return None."""
    if not _is_finite_number(value):
        return None
    return float(value)


def is_public(record):
    """Whether a schema-v2 record is suitable for a public hackathon app."""
    return record.get("public_for_hackathon") is True


_MONTHS_DE = {
    "Januar": 1, "Februar": 2, "März": 3, "April": 4, "Mai": 5, "Juni": 6,
    "Juli": 7, "August": 8, "September": 9, "Oktober": 10, "November": 11,
    "Dezember": 12,
}
_DT_RE = re.compile(r"(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß]+)\s*(\d{4})\s+(\d{1,2}):(\d{2})")
_TIME_ONLY_RE = re.compile(r"(\d{1,2}):(\d{2})")
# The export labels all times "(MESZ)" = CEST; a fixed offset matches that.
CEST = timezone(timedelta(hours=2), "CEST")


def parse_event_datetime(time_text):
    """(start, end) datetimes from a calendar 'Time' display string.

    The 'Time' string is the ONLY place the export carries a full event date
    ('Start Time'/'End Time' are bare HH:MM, 'Weekday' is a label). Formats:

        '9. September 2026 15:15 (MESZ) → 16:15'                       same day
        '8. September 2026 16:00 (MESZ) → 12. September 2026 18:00 (MESZ)'

    Returns (None, None) if unparseable, (start, None) if the end is missing.
    Datetimes are timezone-aware with a fixed +02:00 (CEST/MESZ) offset.
    """
    if not time_text:
        return None, None

    def to_dt(match):
        day, month_name, year, hh, mm = match.groups()
        month = _MONTHS_DE.get(month_name)
        if not month:
            return None
        try:
            return datetime(int(year), month, int(day), int(hh), int(mm), tzinfo=CEST)
        except ValueError:
            return None

    left, _, right = time_text.partition("→")
    m = _DT_RE.search(left)
    start = to_dt(m) if m else None
    if start is None:
        return None, None

    end = None
    m = _DT_RE.search(right)
    if m:
        end = to_dt(m)
    else:
        m = _TIME_ONLY_RE.search(right)
        if m:
            try:
                end = start.replace(hour=int(m.group(1)), minute=int(m.group(2)))
            except ValueError:
                end = None
            if end is not None and end < start:  # crosses midnight
                end += timedelta(days=1)
    return start, end


def event_rows(data, indexes=None, public_only=False):
    """One dict per calendar slot, joined with its project and locations.

    Uses the authoritative direction calendar → project. Venue comes from the
    calendar rollup when it resolves, else from the project. Slots whose
    project is missing are skipped. With ``public_only=True``, the slot and
    project must have ``public_for_hackathon: true``. Directly joined
    locations are retained regardless of their visibility flag. Callers that
    need the complete venue hierarchy can traverse their ``Linked Parent``
    relations through the location index, as required by
    ``_meta.usage.locations_note``.

    'start_dt'/'end_dt' are the parsed full datetimes (see
    parse_event_datetime; None when the 'Time' string is missing).
    'lat'/'lon' are parsed floats from the first location with a complete
    coordinate pair (both None otherwise).
    """
    idx = indexes or build_indexes(data)
    rows = []
    calendar = data.get("calendar")
    for slot in calendar if isinstance(calendar, list) else []:
        project = None
        project_keys = ([slot["project_ref"]] if slot.get("project_ref")
                        else links(slot, "Linked Projects"))
        for k in project_keys:
            project = idx["projects"].get(k)
            if project:
                break
        if project is None:
            continue
        if public_only and not (is_public(slot) and is_public(project)):
            continue
        loc_keys = links(slot, "Linked Location")
        locations = [
            idx["locations"][k]
            for k in loc_keys
            if k in idx["locations"]
        ]
        if not locations:
            locations = [
                idx["locations"][k]
                for k in links(project, "Linked Location")
                if k in idx["locations"]
            ]
        start_dt, end_dt = parse_event_datetime(slot.get("Time"))
        lat = lon = None
        for loc in locations:
            if loc.get("coordinates_ok") is False:
                continue
            lat = parse_coord(loc.get("Latitude"))
            lon = parse_coord(loc.get("Longitude"))
            if lat is not None and lon is not None:
                break
            lat = lon = None
        rows.append({
            "project": project,
            "locations": locations,
            "start_dt": start_dt,
            "end_dt": end_dt,
            "lat": lat,
            "lon": lon,
            "weekday": slot.get("Weekday"),
            "start": slot.get("Start Time"),
            "end": slot.get("End Time"),
            "duration_min": slot.get("Duration"),
            "time_text": slot.get("Time"),
            "language": slot.get("Language") or project.get("Language"),
            "registration_url": slot.get("Registration URL"),
            "highlight": slot.get("Highlight") == "Yes",
            "slot": slot,
        })
    return rows


# ------------------------------------------------------------ schema check

def _is_datetime(value):
    """True for an RFC 3339-style timestamp accepted by JSON Schema."""
    if not isinstance(value, str):
        return False
    if re.fullmatch(
            r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?"
            r"(?:Z|[+-]\d{2}:\d{2})", value, re.IGNORECASE) is None:
        return False
    try:
        normalized = value[:-1] + "+00:00" if value[-1] in "Zz" else value
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return False
    return parsed.tzinfo is not None


def _json_equal(left, right):
    """JSON Schema equality, keeping booleans distinct from JSON numbers."""
    if isinstance(left, bool) or isinstance(right, bool):
        return isinstance(left, bool) and isinstance(right, bool) and left == right
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        return left == right
    if isinstance(left, list) and isinstance(right, list):
        return len(left) == len(right) and all(
            _json_equal(a, b) for a, b in zip(left, right)
        )
    if isinstance(left, dict) and isinstance(right, dict):
        return left.keys() == right.keys() and all(
            _json_equal(left[key], right[key]) for key in left
        )
    return type(left) is type(right) and left == right


def _matches_type(expected, value):
    if isinstance(expected, list):
        return any(_matches_type(option, value) for option in expected)
    return {
        "null": value is None,
        "string": isinstance(value, str),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "number": _is_finite_number(value),
        "boolean": isinstance(value, bool),
        "array": isinstance(value, list),
        "object": isinstance(value, dict),
    }.get(expected, True)


def _schema_violations(prop, value, defs, path=()):
    """Yield violations for the JSON Schema vocabulary used by this export."""
    if isinstance(prop, bool):
        if not prop:
            yield path, "invalid value"
        return

    if "$ref" in prop:
        target = defs[prop["$ref"].rsplit("/", 1)[-1]]
        yield from _schema_violations(target, value, defs, path)

    for branch in prop.get("allOf", []):
        yield from _schema_violations(branch, value, defs, path)

    if "oneOf" in prop:
        matching = [
            branch for branch in prop["oneOf"]
            if not list(_schema_violations(branch, value, defs, path))
        ]
        if len(matching) != 1:
            yield path, "invalid value"
            return

    if "if" in prop:
        condition_matches = not list(
            _schema_violations(prop["if"], value, defs, path)
        )
        branch = prop.get("then") if condition_matches else prop.get("else")
        if branch is not None:
            yield from _schema_violations(branch, value, defs, path)

    if "const" in prop and not _json_equal(value, prop["const"]):
        yield path, "invalid value"
        return

    if "enum" in prop and not any(
        _json_equal(value, option) for option in prop["enum"]
    ):
        yield path, "invalid value"
        return

    expected = prop.get("type")
    if expected is not None and not _matches_type(expected, value):
        yield path, "invalid value"
        return

    if _is_finite_number(value):
        if "minimum" in prop and value < prop["minimum"]:
            yield path, "invalid value"
            return
        if "maximum" in prop and value > prop["maximum"]:
            yield path, "invalid value"
            return

    if isinstance(value, str) and prop.get("format") == "date-time":
        if not _is_datetime(value):
            yield path, "invalid value"
            return

    if isinstance(value, str) and "pattern" in prop:
        if re.search(prop["pattern"], value) is None:
            yield path, "invalid value"
        return

    if isinstance(value, list):
        if "minItems" in prop and len(value) < prop["minItems"]:
            yield path, "invalid value"
            return
        if "maxItems" in prop and len(value) > prop["maxItems"]:
            yield path, "invalid value"
            return
        item_schema = prop.get("items", {})
        for index, item in enumerate(value):
            yield from _schema_violations(item_schema, item, defs, path + (index,))
        return

    if isinstance(value, dict):
        properties = prop.get("properties", {})
        for field in prop.get("required", []):
            if field not in value:
                yield path + (field,), "missing required field"
        additional = prop.get("additionalProperties", {})
        for field, item in value.items():
            if field in properties:
                yield from _schema_violations(
                    properties[field], item, defs, path + (field,))
            elif additional is False:
                yield path + (field,), "unknown field"
            elif isinstance(additional, dict):
                yield from _schema_violations(
                    additional, item, defs, path + (field,))


def _violation_key(path, kind):
    """Map a schema path to the public aggregated violation key."""
    if not path:
        return "<root>", "<root>", kind
    if path[0] in DATABASES:
        if len(path) == 1:
            return "<root>", path[0], kind
        field = path[2] if len(path) > 2 else "<record>"
        return path[0], str(field), kind
    if path[0] == "_meta":
        if len(path) == 1:
            return "<root>", "_meta", kind
        return "_meta", ".".join(map(str, path[1:])), kind
    return "<root>", str(path[0]), kind


def verify(data, schema):
    """Validate an export against the schema; return Counter of violations.

    Keys are (database, field, kind). In addition to JSON Schema violations,
    schema-v2 identity and authoritative calendar-relation invariants are
    checked across records.
    """
    defs = schema.get("$defs", {})
    violations = Counter()
    # A value may violate both its base schema and a conditional/allOf branch.
    # Count one exported field once rather than inflating aggregated totals.
    seen_schema_violations = set()
    for path, kind in _schema_violations(schema, data, defs):
        if (path, kind) in seen_schema_violations:
            continue
        seen_schema_violations.add((path, kind))
        violations[_violation_key(path, kind)] += 1

    # JSON Schema can constrain the individual relation fields, but cannot
    # express that project_ref must equal the sole Linked Projects value.
    # Enforce the schema-v2 calendar relation invariant explicitly.
    databases = {
        db: value if isinstance(value, list) else []
        for db in DATABASES
        for value in [data.get(db) if isinstance(data, dict) else None]
    }

    metadata = data.get("_meta") if isinstance(data, dict) else None
    metadata_databases = (
        metadata.get("databases") if isinstance(metadata, dict) else None)
    if isinstance(metadata_databases, dict):
        for db in DATABASES:
            metadata_entry = metadata_databases.get(db)
            declared_count = (
                metadata_entry.get("count")
                if isinstance(metadata_entry, dict) else None)
            records = data.get(db) if isinstance(data, dict) else None
            if (isinstance(declared_count, int)
                    and not isinstance(declared_count, bool)
                    and isinstance(records, list)
                    and declared_count != len(records)):
                violations[(
                    "_meta", f"databases.{db}.count", "inconsistent value"
                )] += 1

    # canonical_id is the join key for every database. Duplicate values would
    # make build_indexes() silently retain only the first record, so reject
    # them here before any joined view is built.
    seen_ids = set()
    for db, records in databases.items():
        for record in records:
            if not isinstance(record, dict):
                continue
            canonical_id = key_of(record.get("canonical_id"))
            if canonical_id is None:
                continue
            if canonical_id in seen_ids:
                violations[(db, "canonical_id", "duplicate value")] += 1
            else:
                seen_ids.add(canonical_id)

    visibility_expectations = {
        "public": (True, True),
        "offline": (True, False),
        "hidden": (False, False),
        "internal_marker": (False, False),
    }
    for db, records in databases.items():
        for record in records:
            if not isinstance(record, dict):
                continue
            expected = visibility_expectations.get(record.get("visibility_rule"))
            if expected is None:
                continue
            for field, expected_value in zip(
                    ("public_for_hackathon", "link_allowed"), expected):
                actual = record.get(field)
                if isinstance(actual, bool) and actual is not expected_value:
                    violations[(db, field, "inconsistent visibility")] += 1

    project_ids = {
        key
        for record in databases["projects"]
        if isinstance(record, dict)
        for key in [key_of(record.get("canonical_id"))]
        if key is not None
    }
    expected_calendar_ids = defaultdict(list)
    calendar = databases["calendar"]
    for slot in calendar if isinstance(calendar, list) else []:
        if not isinstance(slot, dict):
            continue
        status = slot.get("slot_status")
        project_ref = slot.get("project_ref")
        canonical_project_ref = key_of(project_ref)
        linked_projects = slot.get("Linked Projects")
        if status == "assigned":
            if (canonical_project_ref is not None
                    and isinstance(linked_projects, list)
                    and len(linked_projects) == 1
                    and key_of(linked_projects[0]) is not None
                    and linked_projects != [project_ref]):
                violations[("calendar", "Linked Projects", "invalid value")] += 1
            if (canonical_project_ref is not None
                    and canonical_project_ref not in project_ids):
                violations[("calendar", "project_ref", "unresolved reference")] += 1
            slot_id = key_of(slot.get("canonical_id"))
            if canonical_project_ref in project_ids and slot_id is not None:
                expected_calendar_ids[canonical_project_ref].append(slot_id)

    # projects.calendar_ids is the complete reverse relation derived from the
    # authoritative assigned calendar slots. Compare as multisets so source
    # ordering is irrelevant while duplicate references remain detectable.
    expected_calendar_counts = {
        project_id: Counter(calendar_ids)
        for project_id, calendar_ids in expected_calendar_ids.items()
    }
    empty_calendar_count = Counter()
    for project in databases["projects"]:
        if not isinstance(project, dict):
            continue
        project_id = key_of(project.get("canonical_id"))
        calendar_ids = project.get("calendar_ids")
        if project_id is None or not isinstance(calendar_ids, list):
            continue
        if any(key_of(calendar_id) is None for calendar_id in calendar_ids):
            # Item-level schema validation already reports malformed ids. Do
            # not let unhashable values crash the cross-record comparison.
            continue
        expected_count = expected_calendar_counts.get(
            project_id, empty_calendar_count)
        if Counter(calendar_ids) != expected_count:
            violations[("projects", "calendar_ids", "inconsistent relation")] += 1
    return violations


# ------------------------------------------------------------------- diff

def diff(old, new):
    """Compare two exports; return list of human-readable difference lines."""
    def record_key(record):
        canonical_id = record.get("canonical_id")
        if canonical_id is not None:
            return key_of(canonical_id)
        legacy_id = record.get("id")
        if not isinstance(legacy_id, str):
            return None
        match = _LEGACY_ID_RE.search(legacy_id)
        return match.group(0) if match else None

    out = []
    old_meta = old.get("_meta") or {}
    new_meta = new.get("_meta") or {}
    for field in ("generated_at", "schema_version", "export_filter"):
        old_value = old_meta.get(field)
        new_value = new_meta.get(field)
        if old_value != new_value:
            out.append(f"{field}: {old_value} -> {new_value}")
    for db in DATABASES:
        o_rows, n_rows = old.get(db, []), new.get(db, [])
        if len(o_rows) != len(n_rows):
            out.append(f"{db}: {len(o_rows)} -> {len(n_rows)} records")
        o_fields = {f for r in o_rows for f in r}
        n_fields = {f for r in n_rows for f in r}
        for f in sorted(n_fields - o_fields):
            out.append(f"{db}: field added: {f!r}")
        for f in sorted(o_fields - n_fields):
            out.append(f"{db}: field removed: {f!r}")
        o_keys = {record_key(r) for r in o_rows} - {None}
        n_keys = {record_key(r) for r in n_rows} - {None}
        added, removed = n_keys - o_keys, o_keys - n_keys
        if added:
            out.append(f"{db}: {len(added)} record id(s) added")
        if removed:
            out.append(f"{db}: {len(removed)} record id(s) removed")
        old_by_key = {
            key: record
            for record in o_rows
            for key in [record_key(record)]
            if key is not None
        }
        new_by_key = {
            key: record
            for record in n_rows
            for key in [record_key(record)]
            if key is not None
        }
        changed = sum(
            not _json_equal(old_by_key[key], new_by_key[key])
            for key in old_by_key.keys() & new_by_key.keys()
        )
        if changed:
            out.append(f"{db}: {changed} record(s) changed")
    return out


# -------------------------------------------------------------- summaries

def summary(data):
    """Counts and data-health metrics as human-readable lines."""
    idx = build_indexes(data)
    metadata = data.get("_meta") or {}
    lines = [
        f"generated_at: {metadata.get('generated_at')}",
        f"schema_version: {metadata.get('schema_version')}",
        f"export_filter: {metadata.get('export_filter')}",
    ]
    for db in DATABASES:
        rows = data.get(db, [])
        keyless = sum(
            1 for record in rows if key_of(record.get("canonical_id")) is None
        )
        keyed = len(rows) - keyless
        lines.append(f"{db:9} {len(rows):4} records | {len(idx[db]):4} unique ids"
                     f" | {keyless:3} without id | {keyed - len(idx[db]):3} sharing an id")

    def rate(pairs, target_db):
        vals = [k for rec, field in pairs for k in links(rec, field)]
        ok = sum(1 for k in vals if k in idx[target_db])
        return f"{ok}/{len(vals)}"

    lines.append("link resolution (resolved/total):")
    lines.append(f"  calendar.'Linked Projects' -> projects : "
                 f"{rate([(r, 'Linked Projects') for r in data.get('calendar', [])], 'projects')}  (authoritative)")
    lines.append(f"  projects.calendar_ids -> calendar      : "
                 f"{rate([(r, 'calendar_ids') for r in data.get('projects', [])], 'calendar')}  (recommended reverse)")
    lines.append(f"  projects.'Linked Contacts' -> contacts : "
                 f"{rate([(r, 'Linked Contacts') for r in data.get('projects', [])], 'contacts')}")
    lines.append(f"  projects.'Linked Location' -> locations: "
                 f"{rate([(r, 'Linked Location') for r in data.get('projects', [])], 'locations')}")
    lines.append(f"  contacts.'Linked Projects' -> projects : "
                 f"{rate([(r, 'Linked Projects') for r in data.get('contacts', [])], 'projects')}")
    lines.append(f"  projects.'Linked Parent' -> projects   : "
                 f"{rate([(r, 'Linked Parent') for r in data.get('projects', [])], 'projects')}")
    lines.append(f"  projects.'Linked Child' -> projects    : "
                 f"{rate([(r, 'Linked Child') for r in data.get('projects', [])], 'projects')}")
    lines.append(f"  locations.'Linked Projects' -> projects: "
                 f"{rate([(r, 'Linked Projects') for r in data.get('locations', [])], 'projects')}")
    lines.append(f"  locations.'Linked Parent' -> locations : "
                 f"{rate([(r, 'Linked Parent') for r in data.get('locations', [])], 'locations')}")
    lines.append(f"  locations.'Linked Child' -> locations  : "
                 f"{rate([(r, 'Linked Child') for r in data.get('locations', [])], 'locations')}")
    lines.append(f"  calendar.'Linked Location' -> locations: "
                 f"{rate([(r, 'Linked Location') for r in data.get('calendar', [])], 'locations')}")
    assigned = sum(1 for s in data.get("calendar", [])
                   if s.get("slot_status") == "assigned")
    unassigned = sum(1 for s in data.get("calendar", [])
                     if s.get("slot_status") == "unassigned")
    lines.append(f"calendar slots: {assigned} assigned | {unassigned} unassigned")
    for db in DATABASES:
        public = sum(1 for r in data.get(db, []) if is_public(r))
        lines.append(f"public_for_hackathon ({db}): {public}/{len(data.get(db, []))}")
    rows = event_rows(data, idx)
    timed = sum(1 for r in rows if r["start_dt"] is not None)
    geo = sum(1 for r in rows if r["lat"] is not None)
    lines.append(f"joined event rows (event_rows): {len(rows)}")
    lines.append(f"  with parsed datetime (start_dt): {timed}/{len(rows)}")
    lines.append(f"  with coordinates (lat/lon): {geo}/{len(rows)}")
    return "\n".join(lines)


# --------------------------------------------------------------------- CLI

def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]

    if cmd == "download":
        out = "notion_export.json"
        if "-o" in args:
            out = args[args.index("-o") + 1]
        data = load(DATASET_URL)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print(f"downloaded latest export to {out}")
        print(summary(data))
        return 0

    if cmd == "summary":
        data = load(args[0] if args else DATASET_URL)
        print(summary(data))
        return 0

    if cmd == "verify":
        schema_path = DEFAULT_SCHEMA
        if "--schema" in args:
            i = args.index("--schema")
            schema_path = args[i + 1]
            args = args[:i] + args[i + 2:]
        data = load(args[0] if args else DATASET_URL)
        with open(schema_path, encoding="utf-8") as f:
            schema = json.load(f)
        violations = verify(data, schema)
        if not violations:
            print("OK: export conforms to the schema")
            return 0
        print(f"{sum(violations.values())} violation(s) in {len(violations)} field(s):")
        for (db, field, kind), n in violations.most_common():
            print(f"  {db}.{field!r}: {kind} x{n}")
        return 1

    if cmd == "diff":
        changes = diff(load(args[0]), load(args[1]))
        if not changes:
            print("no structural differences")
            return 0
        print("\n".join(changes))
        return 1

    print(f"unknown command: {cmd}", file=sys.stderr)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
