#!/usr/bin/env python3
"""Profile source CSVs and validate prepared CSVs using only the stdlib."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
import json
from pathlib import Path


def detect_encoding(payload: bytes) -> tuple[str, bool]:
    bom = payload.startswith(b"\xef\xbb\xbf")
    try:
        payload.decode("utf-8-sig")
        return ("utf-8-sig" if bom else "utf-8"), bom
    except UnicodeDecodeError:
        return "iso-8859-1", bom


def detect_delimiter(text: str, requested: str | None) -> str:
    if requested is not None:
        return requested
    try:
        return csv.Sniffer().sniff(text[:16384], delimiters=",;\t").delimiter
    except csv.Error as error:
        raise ValueError("Could not detect CSV delimiter; pass --delimiter") from error


def read_csv(
    path: Path, *, encoding: str | None, delimiter: str | None
) -> tuple[list[str], list[dict[str | None, str | None]], str, str, bool]:
    payload = path.read_bytes()
    detected_encoding, bom = detect_encoding(payload)
    selected_encoding = encoding or detected_encoding
    text = payload.decode(selected_encoding)
    selected_delimiter = detect_delimiter(text, delimiter)
    with path.open(encoding=selected_encoding, newline="") as source:
        reader = csv.DictReader(source, delimiter=selected_delimiter, strict=True)
        if reader.fieldnames is None:
            raise ValueError("CSV has no header")
        rows = list(reader)
    for logical_line, row in enumerate(rows, start=2):
        if None in row:
            raise ValueError(f"Extra column in logical row {logical_line}")
        if any(value is None for value in row.values()):
            raise ValueError(f"Missing column in logical row {logical_line}")
    return reader.fieldnames, rows, selected_encoding, selected_delimiter, bom


def profile(args: argparse.Namespace) -> None:
    fields, rows, encoding, delimiter, bom = read_csv(
        args.path, encoding=args.encoding, delimiter=args.delimiter
    )
    column_stats = {}
    for field in fields:
        values = [(row[field] or "").strip() for row in rows]
        frequencies = Counter(values)
        column_stats[field] = {
            "blank": frequencies[""],
            "unique": len(frequencies),
            "top_values": [
                {"value": value, "count": count}
                for value, count in frequencies.most_common(args.top)
            ],
        }
    row_keys = [tuple((row[field] or "") for field in fields) for row in rows]
    result = {
        "path": str(args.path),
        "bytes": args.path.stat().st_size,
        "encoding": encoding,
        "has_utf8_bom": bom,
        "delimiter": delimiter,
        "logical_rows": len(rows),
        "blank_rows": sum(
            not any((row[field] or "").strip() for field in fields) for row in rows
        ),
        "columns": fields,
        "duplicate_rows": len(row_keys) - len(set(row_keys)),
        "column_stats": column_stats,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


def validate(args: argparse.Namespace) -> None:
    payload = args.path.read_bytes()
    if payload.startswith(b"\xef\xbb\xbf"):
        raise ValueError("Prepared CSV must not contain a UTF-8 BOM")
    if b"\r\n" in payload:
        raise ValueError("Prepared CSV must use LF line endings")
    fields, rows, encoding, delimiter, _ = read_csv(
        args.path, encoding="utf-8", delimiter=","
    )
    if encoding != "utf-8" or delimiter != ",":
        raise ValueError("Prepared CSV must be comma-delimited UTF-8")
    if args.id_field not in fields:
        raise ValueError(f"Missing ID field: {args.id_field!r}")
    identifiers = [(row[args.id_field] or "").strip() for row in rows]
    if any(not identifier for identifier in identifiers):
        raise ValueError("Prepared CSV contains an empty ID")
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("Prepared CSV contains duplicate IDs")
    print(
        f"Validated {len(rows):,} rows, {len(fields):,} columns, "
        f"and {len(identifiers):,} unique IDs in {args.path}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    profile_parser = subparsers.add_parser("profile", help="profile a source CSV")
    profile_parser.add_argument("path", type=Path)
    profile_parser.add_argument("--encoding")
    profile_parser.add_argument("--delimiter")
    profile_parser.add_argument("--top", type=int, default=5)
    profile_parser.set_defaults(func=profile)

    validate_parser = subparsers.add_parser(
        "validate", help="validate the common prepared-CSV contract"
    )
    validate_parser.add_argument("path", type=Path)
    validate_parser.add_argument("--id-field", default="id")
    validate_parser.set_defaults(func=validate)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        args.func(args)
    except (ValueError, csv.Error, UnicodeError) as error:
        raise SystemExit(f"error: {error}") from error


if __name__ == "__main__":
    main()
