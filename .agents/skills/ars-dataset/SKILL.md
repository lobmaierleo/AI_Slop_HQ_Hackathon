---
name: ars-dataset
description: Handle the Ars Electronica Festival 2026 hackathon dataset - download the latest export, update the repo snapshot, verify an export against the JSON schema, detect schema/field drift between versions, look up what fields and databases mean, and build analyses on the data via an importable module (joined event rows with parsed datetimes and coordinates). Use this skill whenever the user mentions the ars dataset, ars-dataset, notion_export.json, the hackathon dataset/export, or asks to download/refresh/validate festival data, check whether the dataset changed, understand a field in it, or analyze/visualize festival events, times, or locations. Read this BEFORE touching the dataset; it has non-obvious ID semantics and known data-quality issues.
---

# Ars Electronica Festival 2026 – Hackathon Dataset Handling

The dataset is one JSON file exported from the festival CMS for the
*NEGOTIATING HUMANITY* festival. It holds four interlinked databases plus a
`_meta` block with usage rules, quality reports, `generated_at`, record counts,
and the active export filter.

The latest export checked for this skill was generated
`2026-07-23T13:22:00.446Z` with `schema_version: 2.0` and
`export_filter: "public_for_hackathon = true"`. It contains `projects` (316),
`contacts` (28), `locations` (140), and `calendar` (7). Its schema fields are
unchanged from July 20, but referential integrity is currently broken; see
`references/data-quality.md` before joining records.

Key places:

- **Download URL** (always the latest export; redirects to the JSON file):
  `https://ars.electronica.art/negotiatinghumanity/hackathondata/`
- **Repo snapshot**: `ars-dataset/notion_export.json` — a local working copy;
  it is **gitignored**, may be older than the live export, and is absent from a
  fresh clone. Feedback sent to the data provider lives in
  `ars-dataset/discussions/`.
- **This skill's tooling**: `scripts/ars_dataset.py` (stdlib-only CLI + importable
  module). Resolve the script relative to this `SKILL.md`: skills.sh normally
  installs it at `.pi/skills/ars-dataset/`, while this source repository keeps
  it at `.agents/skills/ars-dataset/`. Run it for all routine handling instead
  of writing ad-hoc code:

```bash
SKILL_DIR=.pi/skills/ars-dataset                       # participant project
# SKILL_DIR=.agents/skills/ars-dataset                 # this source repository
TOOL="$SKILL_DIR/scripts/ars_dataset.py"
python3 "$TOOL" download -o /tmp/ars-export.json       # fetch latest
python3 "$TOOL" summary [FILE_OR_URL]                   # counts + health metrics
python3 "$TOOL" verify  [FILE_OR_URL]                   # schema + core invariants
python3 "$TOOL" diff OLD.json NEW.json                  # metadata/field/record drift
```

## Participant quick start

In a fresh hackathon project, keep the current export in a project-local data
directory. Download first, then verify and summarize before writing code:

```bash
mkdir -p data
python3 "$TOOL" download -o data/ars-festival-2026.json
python3 "$TOOL" verify data/ars-festival-2026.json
python3 "$TOOL" summary data/ars-festival-2026.json
```

`verify` may report the documented upstream relation failures described below.
Do not “repair” them by guessing. Use `summary` to understand what is actually
resolvable, tell the participant which limitation affects the requested idea,
and build only on valid records.

Before implementation, read `references/data-model.md` for fields and joins and
`references/data-quality.md` for current measured issues. Both live beside this
file in the installed skill. Then inspect a few real records and propose the
smallest data model needed by the feature.

For Python analysis, add the installed script directory to the import path:

```python
from pathlib import Path
import sys

skill_scripts = Path(".pi/skills/ars-dataset/scripts").resolve()
sys.path.insert(0, str(skill_scripts))
from ars_dataset import build_indexes, event_rows, load

data = load("data/ars-festival-2026.json")
indexes = build_indexes(data)
rows = event_rows(data)
```

For a browser project, load the JSON with `fetch`, check `response.ok`, and use
the same semantics documented here when implementing joins. Never expose
non-public records or render a URL when `link_allowed` is false. Keep the
provider attribution in the project and re-run download/verify before the demo
because the export is updated regularly.

Example participant request:

> Use the `ars-dataset` skill. Download and verify the latest festival export
> into `data/`, read the data model and quality notes, inspect representative
> records, and explain which project, location, and calendar fields are safe for
> my idea. Do not change application code yet.

## Task: update the repo snapshot to the latest export

1. Download to a temp file. Never assume the gitignored snapshot is current.
2. `verify` the new file — schema violations mean the source changed; don't
   silently overwrite the snapshot. Referential-integrity violations can also
   occur without field/schema drift, as in the current July 23 export.
3. `diff` the current snapshot against the new file and report to the user
   what changed: `generated_at`, `schema_version`, `export_filter`, record
   counts, added/removed fields, and added/removed records.
4. Replace `ars-dataset/notion_export.json` only after reporting and only when
   validation passes, unless the user explicitly wants to retain a known-bad
   upstream snapshot for investigation. If fields were added/removed or enums
   changed, also update this skill's
   `references/data-model.md` and `references/schema.json` so documentation
   stays truthful.

## Task: verify an export / check for schema drift

`verify` checks every record against `references/schema.json` (unknown
fields, missing required fields, wrong types, unknown enum values) and prints
aggregated violations. It also checks canonical-id uniqueness, the
authoritative calendar/project relation, visibility invariants, and declared
database counts.

The July 23 export is expected to produce 40 core relation violations:
35 projects have `calendar_ids` inconsistent with the seven exported slots,
and five assigned slots reference projects omitted by the public-only filter.
This is a data-integrity failure, not schema drift. `summary` also exposes
unresolved contact, hierarchy, and location back-references. Report these
upstream issues rather than "fixing" or inventing relation targets locally.

`summary` additionally reports known data-health metrics (records without
ids, duplicate ids, all documented link-resolution rates, joined event rows,
and visibility counts). Compare against `references/data-quality.md` to see
whether known issues were fixed at the source or new ones appeared.

## Task: understand the data

- Field-by-field reference for all four databases, enum values, and the
  relations diagram: `references/data-model.md`.
- Known data-quality issues with measured numbers and workarounds (also the
  basis for feedback to the data provider): `references/data-quality.md`.
- Authoritative JSON Schema: `references/schema.json`.

The essentials, because naive code gets them wrong:

- **Join on `canonical_id`.** Every record has this bare 32-character hash,
  and relation-valued `Linked *` fields contain these exact values. `Linked
  Ticket` is the exception: it is free-text ticket information, not a
  relation. The readable `id` remains for display/debugging; do not join on
  it. `id_source` says whether the id came from Notion or was derived
  deterministically.
- **The calendar is the authoritative source of time slots** via
  `calendar."Linked Projects"` or the scalar `calendar.project_ref`.
  `projects.calendar_ids` is the complete, calendar-derived reverse relation.
  `projects."Linked Calendar"` remains unreliable and `projects.Times` is
  display-only. In the current filtered export these authoritative relations
  are broken: `event_rows()` returns zero rows. Do not fabricate missing
  projects, use legacy relations, or relax visibility rules to make a schedule
  appear.
- **No field carries a machine-readable event date.** `Start Time`/`End Time`
  are bare `HH:MM`; the full date exists only inside the calendar `Time`
  display string (`"9. September 2026 15:15 (MESZ) → 16:15"`). Use
  `parse_event_datetime()` or the `start_dt`/`end_dt` fields on `event_rows()`
  output instead of parsing it yourself.
- **Use the explicit visibility fields.** `public_for_hackathon` is the filter
  for demo apps, while `link_allowed` controls whether URLs may be rendered.
  `status_web` is normalized and `visibility_rule` explains the decision.
  `offline` means display is allowed but linking is not. The current export is
  already filtered to public projects, contacts, and calendar rows; locations
  remain unfiltered so the venue hierarchy stays complete. Keep locations
  linked to public records even when the location's own visibility flag is
  false.
- All exported ids are present and unique. Six location coordinates are still
  flagged as suspicious; consult `coordinates_ok` and `_meta.quality`. URLs
  are normalized to include a protocol.
- Some `_meta.quality` counters describe the pre-filter source population
  rather than only the exported arrays. Prefer counts and link-resolution
  metrics computed from the arrays by `summary`; use metadata quality entries
  as source-level diagnostics.
- Editorial length limits are recommendations. Values are not truncated;
  overruns are reported in `_meta.quality.length_warnings`.

## Task: data cleansing or building on the data

This skill's module is importable for downstream work
(`from ars_dataset import load, build_indexes, event_rows, parse_event_datetime, parse_coord, is_public`) —
these functions already encode the join and cleansing rules above. For
time/place analyses, `event_rows()` rows come with ready-to-use `start_dt`/
`end_dt` (tz-aware datetimes) and `lat`/`lon` (parsed floats from the first
location with a complete, non-flagged coordinate pair). It intentionally skips
slots whose project target is absent, so zero rows is the correct result for
the current live export. Read `references/data-quality.md` first; it lists
every known pitfall and safe fallback.
