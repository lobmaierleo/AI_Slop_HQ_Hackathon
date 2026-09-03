# Data quality status and usage rules

Measured against schema version 2.0, export generated
`2026-07-23T13:22:00.446Z`. This export newly applies
`export_filter: "public_for_hackathon = true"` to projects, contacts, and
calendar rows while retaining all locations. The fields still conform to the
schema, but several relation targets were removed by the filter without
recomputing the remaining relations.

## 1. IDs and joins

All 491 exported records have a unique, non-null `canonical_id` containing a bare
32-character hexadecimal value. Every relation-valued `Linked *` value uses
that same key; `Linked Ticket` is free-text ticket information.

| Database | Records | `notion` ids | `derived` ids |
|---|---:|---:|---:|
| projects | 316 | 316 | 0 |
| contacts | 28 | 28 | 0 |
| locations | 140 | 129 | 11 |
| calendar | 7 | 1 | 6 |

Join on `canonical_id`, never on the readable `id`. `id_source: derived`
means the id is deterministic and remains stable while its source content
(such as location hierarchy/name or slot attributes) does not change.

## 2. Referential integrity after filtering

Run `summary` before building joined views. Current resolution rates are:

| Relation | Resolved | Total | Unresolved |
|---|---:|---:|---:|
| `calendar.Linked Projects` → projects | 0 | 5 | 5 |
| `projects.calendar_ids` → calendar | 0 | 75 | 75 |
| `projects.Linked Contacts` → contacts | 32 | 145 | 113 |
| `contacts.Linked Projects` → projects | 32 | 42 | 10 |
| `projects.Linked Parent` → projects | 193 | 322 | 129 |
| `projects.Linked Child` → projects | 193 | 245 | 52 |
| `locations.Linked Projects` → projects | 231 | 554 | 323 |
| `projects.Linked Location` → locations | 231 | 231 | 0 |
| `locations.Linked Parent` → locations | 96 | 96 | 0 |
| `locations.Linked Child` → locations | 96 | 96 | 0 |
| `calendar.Linked Location` → locations | 5 | 5 | 0 |

Missing optional targets must not cause an app to discard the source record.
Treat absent contacts, parent/child projects, and location back-reference
targets as unavailable. Do not create placeholder content that could expose
filtered records.

## 3. Calendar and reverse relation

`calendar` remains the declared authoritative source for concrete times, but
the current exported arrays violate that contract:

- five assigned slots reference two projects omitted from `projects`;
- 35 projects contain 75 `calendar_ids`, none present in `calendar`;
- `verify` therefore reports 40 violations across these two invariants;
- `event_rows()` returns zero rows because it correctly skips slots whose
  projects are missing.

Do not fall back to `projects."Linked Calendar"` or parse `projects.Times` as
structured schedule data. For a timetable, present an unavailable/empty state
until a repaired export is published. The July 20 snapshot can support
historical diagnosis, but it includes hidden records and must not be used to
reintroduce filtered content into a public demo.

## 4. Visibility and metadata scope

Use the explicit output fields instead of inferring visibility from names or
the raw CMS status:

- include a record in a public demo only when `public_for_hackathon` is true;
- render its URL only when `link_allowed` is true;
- use `status_web` and `visibility_rule` to explain/debug the decision.

Only `done` is eligible for visibility. Internal/test markers remain excluded
even when their workflow status is `done`. An `offline` record may be shown but
must not be linked. All 316 projects, 28 contacts, and 7 calendar records in
the current arrays are public. Locations are the exception to source
filtering: all 140 are retained for hierarchy and map context, and only two
carry `public_for_hackathon: true`.

Some `_meta.quality` values were computed before export filtering. For example,
it reports 552 source calendar slots, 64 without projects, and 399 derived
calendar ids even though the exported calendar array contains seven records,
of which six have derived ids. Treat these values as source-level diagnostics;
use `summary` and the arrays themselves for exported counts.

## 5. URLs

`_meta.quality.unparsable_urls` is empty. Source status values such as
`offline` are normalized to null rather than emitted into URL fields. Continue
to respect `link_allowed` before rendering links.

## 6. Coordinates still require caution

Coordinates are JSON numbers, not comma-decimal strings. Use them directly as
WGS84 latitude/longitude values and consult `coordinates_ok`.

Six locations are flagged with `coordinates_ok: false` and listed in
`_meta.quality.suspicious_coordinates`. They contain approximately
`48.09619 / 14.84447`, outside the expected Linz area. Coordinates are not yet
fully reviewed and the provider expects further changes. For map apps, omit
flagged markers or fall back to a verified parent building coordinate.
`event_rows()` never derives `lat`/`lon` from an explicitly flagged location;
it continues to the next joined location with a usable coordinate pair.

## 7. Dates remain display-oriented

`Start Time` and `End Time` contain only `HH:MM`; the date is embedded in the
human-readable calendar `Time` string. Use the skill's
`parse_event_datetime()` helper. Date parsing is only possible after a slot is
successfully joined to its project; the current export has no joined rows.

## 8. Length limits are recommendations

Text length limits are editorial recommendations, not validation constraints.
The exporter does not truncate values. The current metadata reports 133
source-level overruns while including 50 warning examples in
`_meta.quality.length_warnings`; applications should allow wrapping or
truncate only in their own presentation layer.
