---
name: hackathon-datasets
description: Discover, evaluate, fetch, and use the participant-ready datasets published on the Ars Electronica Festival 2026 AI Hackathon website, including each dataset's notes and linked mini-documentation/API reference. Use this skill whenever a participant asks what hackathon or Linz dataset to use, wants to download data from the hackathon website, mentions a dataset page or /datasets/ URL, needs the site's field/format/license/limitations notes, or wants to combine a City of Linz dataset with a project. Read the site documentation before downloading or coding because some entries are APIs or large source files, some are browser-incompatible, and the hosted prepared files have dataset-specific schemas and caveats.
---

# Hackathon website datasets

Help participants get from an idea to correctly loaded data quickly. The public
catalog combines reviewed City of Linz datasets with one separate Ars
Electronica Festival program export. Each Linz dataset page is a compact usage
guide: it documents fitness, format, vintage, license, fields, coordinates,
missing values, limitations, and download/source links. Some pages link to a
deeper mini-document such as an API reference. Treat those notes as part of the
dataset, not as optional background.

## Start here

The current deployed site base is:

```text
https://arselectronicahackathon-web.azurewebsites.net
```

Catalog routes are `/en/datasets/` and `/de/datasets/`. The interface is
bilingual, but the authoritative Linz dataset notes and mini-docs are German on
both routes. Prefer `/de/` when language does not matter.

This skill includes `scripts/hackathon_datasets.py`, a dependency-free helper.
Resolve it relative to this `SKILL.md`; an installed skill will normally live
under `.pi/skills/hackathon-datasets/` rather than in the source repository.

```bash
TOOL=.pi/skills/hackathon-datasets/scripts/hackathon_datasets.py
python3 "$TOOL" catalog
python3 "$TOOL" info trinkbrunnen --include-docs
python3 "$TOOL" download trinkbrunnen --output-dir data/trinkbrunnen
```

If the skill lives elsewhere, locate it first instead of assuming `.pi`. Pass
`--base-url URL` to any command when the participant opened the catalog on a
different official host or when testing a local deployment.

## Choose before downloading

1. Run `catalog` and shortlist the smallest relevant dataset. Start with
   `essential`, then `recommended`; use `optional` only when its extra
   complexity or staleness fits the prototype.
2. Run `info SLUG --include-docs`. Read the whole output, including every
   linked mini-doc. Check format, data vintage, license/attribution, field and
   missing-value meaning, coordinate reference system and axis order, joins,
   freshness, browser/CORS constraints, and safety/legal caveats.
3. State which dataset you chose and why it fits. If the user named one, still
   surface any caveat that can change the implementation or demo claim.
4. Prefer the prepared files hosted by the hackathon site. The `download`
   command intentionally downloads only links below the site's `/datasets/`
   path. It does not silently retrieve large, stale, or differently licensed
   external source files.
5. If the page has no hosted file, follow its documented API or official-source
   workflow. Do not scrape a web page merely to manufacture a dataset.

## Download safely

Choose a project-local directory and keep fetched data separate from source
code:

```bash
mkdir -p data/trinkbrunnen
python3 "$TOOL" download trinkbrunnen --output-dir data/trinkbrunnen
```

The helper uses atomic writes, refuses to overwrite an existing file unless
`--force` is explicit, preserves server filenames, and reports the byte count
and source URL. Commit downloaded files only if their size, license, freshness,
and the project's repository policy make that appropriate.

After downloading:

- inspect the first records and actual types before designing UI;
- parse CSV with a real CSV library, not `split(",")`;
- preserve UTF-8 and treat empty values according to the page notes;
- validate identifiers before joining and never join on labels by convenience;
- for maps, verify CRS, longitude/latitude order, plausible Linz bounds, and
  incomplete coordinates;
- for live APIs, implement the documented timeout, error, caching, CORS/backend,
  quota, and fallback requirements;
- retain provider attribution and license information in the project.

For a quick programmatic view, add `--json` to `catalog` or `info`. Use
`info DATASET/DOC` to inspect one nested page directly, for example:

```bash
python3 "$TOOL" info efa-fahrplanauskunft/api
```

## Load common formats

Use the project's existing stack where possible. For a plain browser project,
these patterns are sufficient starting points after reading the dataset notes.

CSV:

```js
const response = await fetch("/data/trinkbrunnen/Trinkbrunnen.csv");
if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
const csvText = await response.text();
// Use the CSV parser already installed in the project; quoted commas and
// embedded line breaks make hand-written splitting unsafe.
```

JSON or GeoJSON:

```js
const response = await fetch("/data/example/data.geojson");
if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
const data = await response.json();
```

Do not add a new library until checking the existing `package.json` and current
project conventions. Ask the coding agent to inspect a few records and propose
the smallest typed data model before building the full feature.

## Festival program dataset is a separate workflow

The catalog's “Festival 2026 Program Dataset” points to a regularly updated
Ars Electronica CMS JSON export. Use the sibling `ars-dataset` skill for it;
that skill contains the authoritative schema, join rules, visibility rules,
datetime parsing, coordinate checks, validation, and download helper.

Do not treat the festival export like a flat Linz file. In particular, join on
`canonical_id`, take event slots from the calendar side, respect
`public_for_hackathon` and `link_allowed`, and report upstream relation failures
instead of inventing missing records.

## When the website and a cached copy differ

The site is the current participant-facing source. Re-run `info` before making
claims about freshness, fields, API behavior, or limitations. If a previously
downloaded file differs, keep both long enough to compare schema and record
counts; do not overwrite working data blindly. Explain the observed difference
and update parsing only after confirming the new documentation.

## Fast prompt patterns for participants

These requests give an agent enough direction without requiring participants to
know the data model already:

> Use the hackathon-datasets skill. Find the best dataset for a map of public
> drinking water, read all its site notes, download the prepared file into
> `data/`, inspect its fields, and propose the smallest implementation plan.

> Use the hackathon-datasets skill. Read the EFA dataset page and its linked API
> mini-doc. Tell me whether it works directly from this browser-only app and
> suggest a hackathon-safe alternative if not. Do not change code yet.

> Use the ars-dataset skill. Download and verify the latest festival export,
> then explain which project, location, and calendar fields are safe to use.

## Handoff

Report the selected dataset, documentation pages read, exact downloaded files
and source URLs, format/vintage/license, implementation-relevant caveats, and
the first command the participant should run next. If no hosted download exists
or a live service is unsuitable, say so clearly and offer the nearest cataloged
alternative rather than leaving a broken integration.
