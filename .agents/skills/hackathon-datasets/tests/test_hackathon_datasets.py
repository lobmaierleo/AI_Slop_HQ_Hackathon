from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SKILL_DIR = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "hackathon_datasets", SKILL_DIR / "scripts" / "hackathon_datasets.py"
)
module = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(module)


DETAIL_HTML = b"""
<html><style>ignore</style><main>
<h1>Trinkbrunnen</h1><p>Datenstand 2023.</p>
<a href="/datasets/trinkbrunnen/Trinkbrunnen.csv">CSV herunterladen</a>
<a href="/de/datasets/trinkbrunnen/api/">API-Dokumentation</a>
<a href="https://data.example/source">Offizielle Quelle</a>
</main></html>
"""


class ParserTests(unittest.TestCase):
    def test_classifies_hosted_downloads_docs_and_sources(self) -> None:
        parser = module.MainParser()
        parser.feed(DETAIL_HTML.decode())
        page = {
            "url": "https://example.test/de/datasets/trinkbrunnen/",
            "title": parser.title,
            "text": parser.text,
            "links": [
                {**link, "url": module.urljoin("https://example.test", link["href"])}
                for link in parser.links
            ],
        }
        resources = module.classify_links(page, "https://example.test", "trinkbrunnen")
        self.assertEqual(parser.title, "Trinkbrunnen")
        self.assertIn("Datenstand 2023.", parser.text)
        self.assertEqual(len(resources["downloads"]), 1)
        self.assertEqual(len(resources["docs"]), 1)
        self.assertEqual(len(resources["sources"]), 1)

    def test_catalog_deduplicates_dataset_links(self) -> None:
        page = {
            "links": [
                {"url": "https://example.test/de/datasets/baumkataster/", "label": "Baumkataster"},
                {"url": "https://example.test/de/datasets/baumkataster/", "label": "Hinweise"},
                {"url": "https://example.test/de/tutorials/", "label": "Tutorials"},
            ]
        }
        with patch.object(module, "fetch_page", return_value=page):
            result = module.catalog("https://example.test", "de")
        self.assertEqual(result, [{
            "slug": "baumkataster",
            "title": "Baumkataster",
            "url": "https://example.test/de/datasets/baumkataster/",
        }])

    def test_download_is_atomic_and_refuses_overwrite(self) -> None:
        page = {"resources": {"downloads": [{
            "url": "https://example.test/datasets/demo/data.csv", "label": "CSV"
        }]}}
        with tempfile.TemporaryDirectory() as directory, patch.object(
            module,
            "_request_bytes",
            return_value=(b"a,b\n1,2\n", "https://example.test/datasets/demo/data.csv"),
        ):
            target_dir = Path(directory)
            written = module.download_files(page, target_dir, force=False)
            self.assertEqual((target_dir / "data.csv").read_bytes(), b"a,b\n1,2\n")
            self.assertEqual(written[0]["bytes"], 8)
            with self.assertRaisesRegex(RuntimeError, "Refusing to overwrite"):
                module.download_files(page, target_dir, force=False)


if __name__ == "__main__":
    unittest.main()
