#!/usr/bin/env python3
"""Inspect and download participant datasets from the hackathon website."""

from __future__ import annotations

import argparse
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import tempfile
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "https://arselectronicahackathon-web.azurewebsites.net"
USER_AGENT = "ars-hackathon-participant-datasets/1.0"
MAX_HTML_BYTES = 8 * 1024 * 1024
DATASET_ROUTE_RE = re.compile(r"^/(?:en|de)/datasets/([^/?#]+)/?$")


class MainParser(HTMLParser):
    """Collect readable main content and links without third-party packages."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.skip_depth = 0
        self.links: list[dict[str, str]] = []
        self._active_link: dict[str, Any] | None = None
        self._parts: list[str] = []
        self.title = ""
        self._heading: str | None = None
        self._heading_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "main":
            self.in_main = True
            return
        if not self.in_main:
            return
        if tag in {"script", "style", "svg"}:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag in {"h1", "h2", "h3"}:
            self._heading = tag
            self._heading_parts = []
        if tag == "a" and values.get("href"):
            self._active_link = {"href": values["href"], "parts": []}
        if tag in {"p", "li", "h1", "h2", "h3", "dt", "dd", "pre", "tr"}:
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if not self.in_main:
            return
        if self.skip_depth:
            if tag in {"script", "style", "svg"}:
                self.skip_depth -= 1
            return
        if tag == "a" and self._active_link is not None:
            label = _clean_text(" ".join(self._active_link["parts"]))
            self.links.append({"href": self._active_link["href"], "label": label})
            self._active_link = None
        if tag == self._heading:
            heading_text = _clean_text(" ".join(self._heading_parts))
            if self._heading == "h1" and not self.title:
                self.title = heading_text
            self._heading = None
            self._heading_parts = []
        if tag in {"p", "li", "h1", "h2", "h3", "dd", "pre", "tr"}:
            self._parts.append("\n")
        if tag == "main":
            self.in_main = False

    def handle_data(self, data: str) -> None:
        if not self.in_main or self.skip_depth:
            return
        text = html.unescape(data)
        self._parts.append(text)
        if self._active_link is not None:
            self._active_link["parts"].append(text)
        if self._heading is not None:
            self._heading_parts.append(text)

    @property
    def text(self) -> str:
        lines = [_clean_text(line) for line in "".join(self._parts).splitlines()]
        return "\n".join(line for line in lines if line)


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _request_bytes(url: str, *, max_bytes: int | None = None) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=30) as response:
            final_url = response.geturl()
            if max_bytes is None:
                return response.read(), final_url
            data = response.read(max_bytes + 1)
    except HTTPError as exc:
        raise RuntimeError(f"HTTP {exc.code} while fetching {url}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not fetch {url}: {exc.reason}") from exc
    if len(data) > max_bytes:
        raise RuntimeError(f"HTML response exceeds {max_bytes} bytes: {url}")
    return data, final_url


def fetch_page(url: str) -> dict[str, Any]:
    payload, final_url = _request_bytes(url, max_bytes=MAX_HTML_BYTES)
    parser = MainParser()
    parser.feed(payload.decode("utf-8", errors="replace"))
    links = [{**link, "url": urljoin(final_url, link["href"])} for link in parser.links]
    return {"url": final_url, "title": parser.title, "text": parser.text, "links": links}


def normalized_base(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("--base-url must be an absolute HTTP(S) URL")
    return f"{parsed.scheme}://{parsed.netloc}"


def catalog(base_url: str, lang: str) -> list[dict[str, str]]:
    page = fetch_page(f"{base_url}/{lang}/datasets/")
    found: dict[str, dict[str, str]] = {}
    for link in page["links"]:
        match = DATASET_ROUTE_RE.match(urlparse(link["url"]).path)
        if not match:
            continue
        slug = match.group(1)
        found.setdefault(slug, {"slug": slug, "title": link["label"] or slug, "url": link["url"]})
    return list(found.values())


def page_url(base_url: str, lang: str, identifier: str) -> str:
    clean = identifier.strip("/")
    if not clean or any(part in {".", ".."} for part in clean.split("/")):
        raise ValueError("dataset identifier must be a slug such as trinkbrunnen or efa-fahrplanauskunft/api")
    return f"{base_url}/{lang}/datasets/{clean}/"


def classify_links(page: dict[str, Any], base_url: str, dataset_slug: str) -> dict[str, list[dict[str, str]]]:
    base = urlparse(base_url)
    result: dict[str, list[dict[str, str]]] = {"downloads": [], "docs": [], "sources": []}
    seen: set[str] = set()
    doc_re = re.compile(rf"^/(?:en|de)/datasets/{re.escape(dataset_slug)}/([^/]+)/?$")
    for link in page["links"]:
        url = link["url"]
        if url in seen:
            continue
        seen.add(url)
        parsed = urlparse(url)
        item = {"label": link["label"], "url": url}
        if parsed.netloc == base.netloc and parsed.path.startswith("/datasets/"):
            result["downloads"].append(item)
        elif parsed.netloc == base.netloc and doc_re.match(parsed.path):
            result["docs"].append(item)
        elif parsed.netloc != base.netloc and parsed.scheme in {"http", "https"}:
            result["sources"].append(item)
    return result


def info(base_url: str, lang: str, identifier: str, include_docs: bool) -> dict[str, Any]:
    page = fetch_page(page_url(base_url, lang, identifier))
    dataset_slug = identifier.strip("/").split("/")[0]
    page["resources"] = classify_links(page, base_url, dataset_slug)
    page["documents"] = []
    if include_docs and "/" not in identifier.strip("/"):
        for doc in page["resources"]["docs"]:
            nested = fetch_page(doc["url"])
            nested["resources"] = classify_links(nested, base_url, dataset_slug)
            page["documents"].append(nested)
    return page


def safe_filename(url: str) -> str:
    name = Path(unquote(urlparse(url).path)).name
    if not name or name in {".", ".."} or Path(name).name != name:
        raise RuntimeError(f"Cannot derive a safe filename from {url}")
    return name


def download_files(page: dict[str, Any], output_dir: Path, force: bool) -> list[dict[str, Any]]:
    resources = page["resources"]["downloads"]
    if not resources:
        raise RuntimeError(
            "This dataset page has no hackathon-hosted file. Read its notes and linked mini-docs for the API or official-source workflow."
        )
    output_dir.mkdir(parents=True, exist_ok=True)
    written: list[dict[str, Any]] = []
    for resource in resources:
        target = output_dir / safe_filename(resource["url"])
        if target.exists() and not force:
            raise RuntimeError(f"Refusing to overwrite {target}; pass --force to replace it")
        payload, final_url = _request_bytes(resource["url"])
        descriptor, temp_name = tempfile.mkstemp(prefix=f".{target.name}.", dir=output_dir)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(payload)
                stream.flush()
                os.fsync(stream.fileno())
            os.chmod(temp_name, 0o644)
            os.replace(temp_name, target)
        except Exception:
            try:
                os.unlink(temp_name)
            except FileNotFoundError:
                pass
            raise
        written.append({"path": str(target), "bytes": len(payload), "url": final_url})
    return written


def print_info(result: dict[str, Any]) -> None:
    print(f"# {result['title'] or 'Dataset notes'}")
    print(f"URL: {result['url']}\n")
    print(result["text"])
    resources = result["resources"]
    for heading, key in (("Hosted downloads", "downloads"), ("Mini-docs", "docs"), ("Official sources and APIs", "sources")):
        if resources[key]:
            print(f"\n## {heading}")
            for link in resources[key]:
                print(f"- {link['label'] or '(unlabelled)'}: {link['url']}")
    for document in result.get("documents", []):
        print(f"\n\n# Linked mini-doc: {document['title'] or document['url']}")
        print(f"URL: {document['url']}\n")
        print(document["text"])


def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--base-url", default=DEFAULT_BASE_URL, help="official site origin")
    common.add_argument("--lang", choices=("de", "en"), default="de", help="interface route language")
    common.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("catalog", parents=[common], help="list datasets on the live catalog")
    info_parser = subparsers.add_parser("info", parents=[common], help="read dataset notes and discover resources")
    info_parser.add_argument("identifier", help="dataset slug or nested path such as efa-fahrplanauskunft/api")
    info_parser.add_argument("--include-docs", action="store_true", help="also fetch linked mini-documentation")
    download_parser = subparsers.add_parser("download", parents=[common], help="download site-hosted prepared files")
    download_parser.add_argument("identifier", help="dataset slug")
    download_parser.add_argument("--output-dir", type=Path, required=True, help="project-local destination directory")
    download_parser.add_argument("--force", action="store_true", help="replace existing files")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        base_url = normalized_base(args.base_url)
        if args.command == "catalog":
            result: Any = catalog(base_url, args.lang)
            if args.json:
                print(json.dumps(result, ensure_ascii=False, indent=2))
            else:
                for item in result:
                    print(f"{item['slug']}\t{item['title']}\t{item['url']}")
            return 0
        if args.command == "info":
            result = info(base_url, args.lang, args.identifier, args.include_docs)
            if args.json:
                print(json.dumps(result, ensure_ascii=False, indent=2))
            else:
                print_info(result)
            return 0
        page = info(base_url, args.lang, args.identifier, include_docs=False)
        result = download_files(page, args.output_dir, args.force)
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            for item in result:
                print(f"{item['path']}\t{item['bytes']} bytes\t{item['url']}")
        return 0
    except (RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
