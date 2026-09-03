---
name: opendata-linz-converter
description: Convert, normalize, document, refresh, or quality-check datasets in this repository's `opendata-linz/` collection. Use this skill whenever the user asks to convert a Linz Open Data CSV/JSON/XML/Shapefile, standardize a dataset for students or `web/`, add a preparation script, refresh a prepared snapshot, decide readiness after conversion, or update an `opendata-linz` dataset README—even if they only name the dataset. Read this before touching those files because the repository has a specific output contract, documentation schema, coordinate rules, and validation workflow.
---

# Linz Open Data conversion

Prepare official Linz datasets so students aged 14+ can use them without first
solving encoding, delimiter, schema, identifier, or coordinate-system problems.
Treat a conversion as a small reproducible data product: prepared data,
converter, validation, documentation, and readiness decision belong together.

## Repository contract

Work in the existing `opendata-linz/<dataset>/` directory. Before editing:

1. Read the repository `AGENTS.md`, the dataset `README.md`, the central
   `opendata-linz/README.md`, and one or two comparable completed converters.
2. Inspect `web/src/content.config.ts` and the dataset-page implementation if
   the frontmatter or download presentation is unfamiliar. `web/` discovers
   dataset pages from their READMEs.
3. Check `git status`. Preserve every unrelated user change and incorporate
   relevant edits rather than replacing them.
4. Determine whether the request authorizes conversion or only investigation.
   A conversion request authorizes local source downloads, converter/output
   creation, documentation updates, and proportionate validation. It does not
   authorize publishing, committing, or changing unrelated datasets.

Use these completed examples according to the source shape:

- `herkunftslaender-gaeste/prepare_herkunftslaender_gaeste.py`: reshape a wide
  table into tidy observations.
- `hotspots/prepare_hotspots.py`: convert two related CSVs and resolve joins.
- `strassennamen/prepare_strassennamen.py`: convert current/historical files.
- `trinkbrunnen/prepare_trinkbrunnen.py` and
  `wc-anlagen/prepare_wc_anlagen.py`: normalize projected point data.
- `linztermine/prepare_linztermine.py`: combine multiple XML APIs into JSON.

## Acquire and preserve the source

Use the official publisher or catalog URL already documented in the dataset.
If it may have changed, inspect the current catalog/publisher directory and
record the exact URL and `Last-Modified` value. Prefer official sources.

Download into `/tmp` first. Never overwrite an existing prepared output with a
download. Inspect the payload before trusting the extension: an `.xls` URL can
return HTML, a CSV can contain a BOM or embedded newlines, and XML declarations
can disagree with the actual bytes.

After inspection, copy the source to a descriptive ignored filename such as:

```text
Dataset-source.csv
Dataset-current-source.csv
Dataset-historical-source.csv
```

Add only those exact source names to the dataset's `.gitignore`. Prepared
outputs and converter scripts remain trackable. Do not add broad patterns that
could hide deliverables.

## Profile before designing the schema

Run `scripts/csv_audit.py profile SOURCE` for CSV input, then inspect representative
rows directly. For every source establish:

- actual encoding, BOM, delimiter, quoting, embedded line breaks, and columns;
- logical row count rather than physical line count;
- blank, unique, duplicate, sentinel, total, and malformed values;
- identifier uniqueness and relationships between multiple files;
- date/time syntax, timezone meaning, units, decimal conventions, and booleans;
- coordinate presence, axis order, CRS, valid range, and geometry type;
- source freshness, license, attribution, and safety/currentness caveats.

Do not infer semantics from a field name alone. Preserve unexplained codes and
document them. Do not turn blanks into zero or false. Do not silently discard
totals, historical records, failed joins, inactive records, or missing
coordinates. If a questionable value is preserved, make that explicit in the
README.

## Design the student-facing output

Prefer the smallest structure that supports ordinary analysis:

- UTF-8 without BOM;
- comma-delimited CSV with `\n` line endings for flat tables;
- JSON for nested records, repeated occurrences, or several linked registries;
- one observation per row for time series instead of months/quarters as columns;
- clear lower-case `snake_case` field names, normally in German to match the
  source and repository;
- deterministic `id` values, plus `quell_id` when the publisher supplies an ID;
- decimal points, ISO dates (`YYYY-MM-DD`), and ISO datetimes;
- `true`/`false` for known booleans and an empty CSV field or JSON `null` for
  unknown values;
- empty strings for unknown text, never invented placeholders;
- source spelling preserved where correcting it would change meaning.

Use a readable source ID with a dataset prefix when it is stable and unique.
Otherwise hash an explicitly documented natural-key tuple with SHA-256 and keep
enough hexadecimal characters to make collision risk negligible. Validate the
result; never assume the source key is unique.

Keep fields that help provenance, joining, or interpretation. Remove only
purely accidental formatting such as BOMs, surrounding whitespace, repeated
internal whitespace, or source-only empty columns. Avoid clever enrichment
unless the mapping is authoritative and auditable.

## Coordinates

Web-map outputs need WGS84 longitude and latitude named `lon` and `lat`.
Preserve projected source values alongside them as `epsg<code>_x` and
`epsg<code>_y`.

For EPSG:31255 point coordinates, use
`opendata-linz/coordinate_conversion.py`; it is dependency-free and shared by
the prepared point converters. Validate both source bounds and transformed
Linz bounds. Confirm axis order from actual magnitudes and source metadata:
some publisher columns are mislabeled.

Do not guess an unknown CRS. Stop conversion of the coordinates, preserve the
raw values, and document the blocker until authoritative metadata or a
verifiable control point exists. For Shapefiles, read the `.prj`, require all
sidecar files, preserve geometry types, and validate feature counts before and
after reprojection.

## Write a reproducible converter

Create `prepare_<dataset>.py`. Prefer the Python standard library; add a
dependency only when a standard-library implementation would be fragile, such
as complex geometry reprojection. Reuse repository helpers before adding code.

The converter must:

1. Have useful `--help`, local-source defaults, and configurable output paths.
2. Refuse identical input and output paths.
3. Read with `newline=""` and a real parser; never split CSV rows manually.
4. Validate the exact source header so schema drift fails visibly.
5. Reject extra/missing columns, malformed records, invalid typed values,
   duplicate IDs, and generated-ID collisions.
6. Normalize intentionally and field-by-field. Preserve unknowns.
7. Write to a temporary file in the output directory, flush and `fsync`, then
   replace atomically and set mode `0644`.
8. Print concise counts: records written, unique IDs, conversions, unresolved
   joins, and meaningful missing values.
9. Avoid hard-coded row counts when the source is rolling. Fixed snapshot
   expectations are useful only when a count change necessarily indicates a
   broken or wrong input.
10. Produce deterministic bytes for the same input.

Never embed retrieval time in prepared output unless it is supplied as a
parameter for reproducible offline builds.

## Document the result

Update the dataset `README.md` with exactly one frontmatter value for each:

```yaml
title:
summary:
provider:
status: essential | recommended | optional
priority: 0
format:
license:
data_vintage:
```

`priority` is optional and defaults to `0`. Higher values appear first within
the same status; equal priorities are sorted lexically by title.

The body should contain:

- a factual description with exact prepared record counts;
- direct GitHub raw-download links and approximate sizes;
- the important fields, joins, missing-value meaning, coordinate usage, and
  known limitations;
- a short refresh command for the converter;
- official catalog and source links;
- a warning where operational, legal, accessibility, safety, or service state
  can become stale.

Set `recommended` only when the checked-in output is directly usable and the
remaining caveats are understandable. Use `optional` for secondary or
experimental sources. Track incomplete preparation and integration work in
private task tracking instead of exposing another public readiness state.
`essential` requires unusually strong relevance, freshness, and quality;
conversion alone does not justify it.

When preparation changes a portfolio decision or the user asks for it, update
the matching row in `opendata-linz/README.md`. Do not rewrite historical
assessment reports unless asked.

## Verification gate

Complete all relevant checks before reporting success:

1. Regenerate each output from the ignored local source.
2. Regenerate to a temporary directory and compare bytes with `cmp`.
3. Parse every output strictly and assert expected columns, logical row counts,
   nonempty unique IDs, join integrity, encoding, and domain/range rules.
4. Run `scripts/csv_audit.py validate OUTPUT` for each prepared CSV.
5. For coordinate data, assert WGS84 values fall within a plausible Linz
   bounding box and compare at least one known control point when available.
6. Exercise invalid input where the converter contains nontrivial validation:
   wrong header, duplicate key, invalid boolean/number, or incomplete
   coordinate pair must fail without replacing the good output.
7. Parse Python syntax without leaving bytecode:
   `python3 -c "import ast,pathlib; ast.parse(pathlib.Path('SCRIPT.py').read_text())"`
8. Run `git diff --check`.
9. From `web/`, run `./node_modules/.bin/astro check`.
10. Inspect `git status` and verify that sources are ignored while scripts,
    READMEs, helpers, and prepared outputs are visible.

If a check exposes a source-quality problem, keep the evidence, adjust the
schema or readiness honestly, and rerun the full gate.

## Handoff

Lead with what is ready. List each prepared output with record count and a
clickable local link, then mention converters/documentation and the validation
result. Call out unresolved caveats that affect student use. Do not bury a
failed check.
