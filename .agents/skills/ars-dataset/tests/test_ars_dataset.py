import copy
import importlib.util
import unittest
from datetime import datetime
from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location(
    "ars_dataset", SKILL_DIR / "scripts" / "ars_dataset.py")
ars_dataset = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ars_dataset)


def valid_export():
    return {
        "_meta": {
            "source": "Ars Electronica Festival 2026",
            "website": "https://ars.electronica.art/negotiatinghumanity",
            "author": "Ars Electronica",
            "generated_at": "2026-07-20T07:59:49.183Z",
            "encoding": "UTF-8",
            "schema_version": "2.0",
            "export_filter": "all records",
            "usage": {},
            "quality": {},
            "databases": {
                "projects": {"description": "Projects", "count": 1},
                "contacts": {"description": "Contacts", "count": 0},
                "locations": {"description": "Locations", "count": 0},
                "calendar": {"description": "Calendar", "count": 0},
            },
        },
        "projects": [{
            "id": "Project-0123456789abcdef0123456789abcdef",
            "canonical_id": "0123456789abcdef0123456789abcdef",
            "id_source": "notion",
            "Name EN": "Example",
            "Curatorial Highlight": "No",
            "Timetable": "No",
            "Status Web": "pending",
            "status_web": "pending",
            "visibility_rule": "hidden",
            "public_for_hackathon": False,
            "link_allowed": False,
            "calendar_ids": [],
            "Web Link": None,
        }],
        "contacts": [],
        "locations": [],
        "calendar": [],
    }


def valid_calendar_entry():
    project_id = "0123456789abcdef0123456789abcdef"
    return {
        "id": "3123456789abcdef0123456789abcdef",
        "canonical_id": "3123456789abcdef0123456789abcdef",
        "id_source": "notion",
        "Linked Projects": [project_id],
        "Status Web": "pending",
        "start_at": "2026-09-09T15:15:00+02:00",
        "end_at": "2026-09-09T16:15:00+02:00",
        "status_web": "pending",
        "visibility_rule": "hidden",
        "public_for_hackathon": False,
        "link_allowed": False,
        "project_ref": project_id,
        "slot_status": "assigned",
    }


def valid_assigned_export():
    data = valid_export()
    slot = valid_calendar_entry()
    data["calendar"] = [slot]
    data["_meta"]["databases"]["calendar"]["count"] = 1
    data["projects"][0]["calendar_ids"] = [slot["canonical_id"]]
    return data, slot


def valid_location():
    return {
        "id": "1123456789abcdef0123456789abcdef",
        "canonical_id": "1123456789abcdef0123456789abcdef",
        "id_source": "notion",
        "Status Web": "pending",
        "status_web": "pending",
        "visibility_rule": "hidden",
        "public_for_hackathon": False,
        "link_allowed": False,
        "coordinates_ok": True,
        "Latitude": 48.3,
        "Longitude": 14.3,
    }


class ParseEventDatetimeTests(unittest.TestCase):
    def test_same_day_range(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → 16:15")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 9, 16, 15, tzinfo=ars_dataset.CEST))

    def test_full_date_range(self):
        start, end = ars_dataset.parse_event_datetime(
            "8. September 2026 16:00 (MESZ) → "
            "12. September 2026 18:00 (MESZ)")

        self.assertEqual(
            start, datetime(2026, 9, 8, 16, 0, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 12, 18, 0, tzinfo=ars_dataset.CEST))

    def test_time_only_end_crosses_midnight(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 23:30 (MESZ) → 01:15")

        self.assertEqual(
            start, datetime(2026, 9, 9, 23, 30, tzinfo=ars_dataset.CEST))
        self.assertEqual(
            end, datetime(2026, 9, 10, 1, 15, tzinfo=ars_dataset.CEST))

    def test_missing_or_garbage_input_is_unparseable(self):
        for value in (None, "", "not a festival time"):
            with self.subTest(value=value):
                self.assertEqual(
                    ars_dataset.parse_event_datetime(value), (None, None))

    def test_invalid_start_time_is_unparseable(self):
        self.assertEqual(
            ars_dataset.parse_event_datetime(
                "9. September 2026 99:99 (MESZ) → 16:15"),
            (None, None),
        )

    def test_invalid_full_date_end_returns_start_only(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → "
            "10. September 2026 99:99 (MESZ)")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertIsNone(end)

    def test_invalid_time_only_end_returns_start_only(self):
        start, end = ars_dataset.parse_event_datetime(
            "9. September 2026 15:15 (MESZ) → 99:99")

        self.assertEqual(
            start, datetime(2026, 9, 9, 15, 15, tzinfo=ars_dataset.CEST))
        self.assertIsNone(end)


class SchemaV2HelperTests(unittest.TestCase):
    def test_build_indexes_uses_canonical_id(self):
        data = valid_export()
        data["projects"][0]["id"] = "readable-without-a-hash"

        indexes = ars_dataset.build_indexes(data)

        self.assertIn(
            "0123456789abcdef0123456789abcdef", indexes["projects"])

    def test_build_indexes_does_not_fall_back_to_readable_id(self):
        data = valid_export()
        data["projects"][0].pop("canonical_id")

        indexes = ars_dataset.build_indexes(data)

        self.assertFalse(indexes["projects"])

    def test_build_indexes_does_not_mutate_source_records(self):
        data = valid_export()
        before = copy.deepcopy(data)

        ars_dataset.build_indexes(data)

        self.assertEqual(data, before)
        self.assertNotIn("_key", data["projects"][0])

    def test_key_of_accepts_only_bare_canonical_ids(self):
        canonical_id = "0123456789abcdef0123456789abcdef"
        self.assertEqual(ars_dataset.key_of(canonical_id), canonical_id)
        self.assertIsNone(ars_dataset.key_of("Project-" + canonical_id))

    def test_parse_coord_accepts_only_schema_v2_numbers(self):
        self.assertEqual(ars_dataset.parse_coord(48.309619), 48.309619)
        self.assertIsNone(ars_dataset.parse_coord("48,309619"))
        self.assertIsNone(ars_dataset.parse_coord(True))
        self.assertIsNone(ars_dataset.parse_coord(float("nan")))
        self.assertIsNone(ars_dataset.parse_coord(float("inf")))

    def test_is_public_requires_explicit_true(self):
        self.assertTrue(ars_dataset.is_public({"public_for_hackathon": True}))
        self.assertFalse(ars_dataset.is_public({"public_for_hackathon": False}))
        self.assertFalse(ars_dataset.is_public({}))

    def test_public_event_rows_keep_locations_regardless_of_visibility(self):
        project_id = "0123456789abcdef0123456789abcdef"
        public_location_id = "1123456789abcdef0123456789abcdef"
        hidden_location_id = "2123456789abcdef0123456789abcdef"
        data = {
            "projects": [{
                "canonical_id": project_id,
                "Name EN": None,
                "public_for_hackathon": True,
                "Linked Location": [hidden_location_id, public_location_id],
            }],
            "contacts": [],
            "locations": [{
                "canonical_id": hidden_location_id,
                "public_for_hackathon": False,
                "coordinates_ok": True,
                "Latitude": 48.1,
                "Longitude": 14.1,
            }, {
                "canonical_id": public_location_id,
                "public_for_hackathon": True,
                "coordinates_ok": True,
                "Latitude": 48.2,
                "Longitude": 14.2,
            }],
            "calendar": [{
                "canonical_id": "3123456789abcdef0123456789abcdef",
                "project_ref": project_id,
                "public_for_hackathon": True,
            }],
        }

        rows = ars_dataset.event_rows(data, public_only=True)

        self.assertEqual(len(rows), 1)
        self.assertEqual(
            [location["canonical_id"] for location in rows[0]["locations"]],
            [hidden_location_id, public_location_id],
        )
        self.assertEqual((rows[0]["lat"], rows[0]["lon"]), (48.1, 14.1))

    def test_event_rows_skip_suspicious_coordinates(self):
        project_id = "0123456789abcdef0123456789abcdef"
        flagged_location_id = "1123456789abcdef0123456789abcdef"
        verified_location_id = "2123456789abcdef0123456789abcdef"
        data = {
            "projects": [{
                "canonical_id": project_id,
                "Linked Location": [flagged_location_id, verified_location_id],
            }],
            "contacts": [],
            "locations": [{
                "canonical_id": flagged_location_id,
                "coordinates_ok": False,
                "Latitude": 48.09619,
                "Longitude": 14.84447,
            }, {
                "canonical_id": verified_location_id,
                "coordinates_ok": True,
                "Latitude": 48.3,
                "Longitude": 14.3,
            }],
            "calendar": [{
                "canonical_id": "3123456789abcdef0123456789abcdef",
                "project_ref": project_id,
            }],
        }

        rows = ars_dataset.event_rows(data)

        self.assertEqual(len(rows), 1)
        self.assertEqual(len(rows[0]["locations"]), 2)
        self.assertEqual((rows[0]["lat"], rows[0]["lon"]), (48.3, 14.3))

    def test_event_rows_fall_back_when_slot_locations_do_not_resolve(self):
        data, slot = valid_assigned_export()
        location = valid_location()
        data["locations"] = [location]
        data["projects"][0]["Linked Location"] = [location["canonical_id"]]
        slot["Linked Location"] = ["f" * 32]

        rows = ars_dataset.event_rows(data)

        self.assertEqual(rows[0]["locations"], [location])
        self.assertEqual((rows[0]["lat"], rows[0]["lon"]), (48.3, 14.3))


class VerifyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = ars_dataset.load(SKILL_DIR / "references" / "schema.json")

    def verify(self, mutate=None):
        data = valid_export()
        if mutate:
            mutate(data)
        return ars_dataset.verify(data, self.schema)

    def test_valid_export_passes(self):
        self.assertFalse(self.verify())

    def test_verify_does_not_mutate_export(self):
        data = valid_export()
        before = copy.deepcopy(data)

        ars_dataset.verify(data, self.schema)

        self.assertEqual(data, before)

    def test_root_must_be_an_object(self):
        violations = ars_dataset.verify([], self.schema)

        self.assertEqual(
            violations[("<root>", "<root>", "invalid value")], 1)

    def test_unknown_record_field_is_rejected(self):
        violations = self.verify(
            lambda data: data["projects"][0].update({"Unexpected": True}))
        self.assertEqual(
            violations[("projects", "Unexpected", "unknown field")], 1)

    def test_visibility_flag_must_be_boolean(self):
        violations = self.verify(
            lambda data: data["projects"][0].update(
                {"public_for_hackathon": "false"}))
        self.assertEqual(
            violations[("projects", "public_for_hackathon", "invalid value")],
            1,
        )

    def test_visibility_fields_must_be_consistent(self):
        violations = self.verify(
            lambda data: data["projects"][0].update({
                "visibility_rule": "internal_marker",
                "public_for_hackathon": True,
                "link_allowed": True,
            }))

        self.assertEqual(
            violations[(
                "projects", "public_for_hackathon",
                "inconsistent visibility",
            )],
            1,
        )
        self.assertEqual(
            violations[("projects", "link_allowed", "inconsistent visibility")],
            1,
        )
        self.assertEqual(
            violations[("projects", "public_for_hackathon", "invalid value")],
            1,
        )
        self.assertEqual(
            violations[("projects", "link_allowed", "invalid value")],
            1,
        )

    def test_url_fields_require_http_or_https(self):
        violations = self.verify(
            lambda data: data["projects"][0].update(
                {"Web Link": "javascript:alert(1)"}))

        self.assertEqual(
            violations[("projects", "Web Link", "invalid value")], 1)

    def test_coordinates_must_be_finite_and_within_wgs84_bounds(self):
        for latitude in (91, float("inf")):
            with self.subTest(latitude=latitude):
                data = valid_export()
                location = valid_location()
                location["Latitude"] = latitude
                data["locations"] = [location]

                violations = ars_dataset.verify(data, self.schema)

                self.assertEqual(
                    violations[("locations", "Latitude", "invalid value")], 1)

    def test_canonical_id_must_be_bare_lowercase_hex(self):
        for canonical_id in (
                "not-a-canonical-id",
                "0123456789ABCDEF0123456789ABCDEF",
                "Project-0123456789abcdef0123456789abcdef"):
            with self.subTest(canonical_id=canonical_id):
                violations = self.verify(
                    lambda data: data["projects"][0].update(
                        {"canonical_id": canonical_id}))
                self.assertEqual(
                    violations[("projects", "canonical_id", "invalid value")],
                    1,
                )

    def test_linked_ids_must_be_canonical_ids(self):
        violations = self.verify(
            lambda data: data["projects"][0].update(
                {"Linked Contacts": ["not-a-canonical-id"]}))
        self.assertEqual(
            violations[("projects", "Linked Contacts", "invalid value")],
            1,
        )

    def test_assigned_slot_requires_matching_project_relations(self):
        cases = (
            ({"project_ref": None, "Linked Projects": None},
             {"project_ref", "Linked Projects"}),
            ({"Linked Projects": None}, {"Linked Projects"}),
            ({"Linked Projects": ["1123456789abcdef0123456789abcdef"]},
             {"Linked Projects"}),
        )
        for changes, invalid_fields in cases:
            with self.subTest(changes=changes):
                data, slot = valid_assigned_export()
                slot.update(changes)

                violations = ars_dataset.verify(data, self.schema)

                for field in invalid_fields:
                    self.assertEqual(
                        violations[("calendar", field, "invalid value")], 1)

    def test_assigned_slot_enforces_linked_project_item_bounds(self):
        for linked_projects in ([], ["1" * 32, "2" * 32]):
            with self.subTest(linked_projects=linked_projects):
                data, slot = valid_assigned_export()
                slot["Linked Projects"] = linked_projects

                violations = ars_dataset.verify(data, self.schema)

                self.assertEqual(
                    violations[("calendar", "Linked Projects", "invalid value")],
                    1,
                )

    def test_duplicate_canonical_id_is_rejected(self):
        data = valid_export()
        duplicate = dict(data["projects"][0])
        duplicate["id"] = "Duplicate-0123456789abcdef0123456789abcdef"
        data["projects"].append(duplicate)

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("projects", "canonical_id", "duplicate value")], 1)

    def test_assigned_slot_project_reference_must_resolve(self):
        data, slot = valid_assigned_export()
        missing_id = "f" * 32
        slot.update({
            "project_ref": missing_id,
            "Linked Projects": [missing_id],
        })

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("calendar", "project_ref", "unresolved reference")],
            1,
        )

    def test_malformed_project_reference_is_reported_without_crashing(self):
        data, slot = valid_assigned_export()
        slot.update({"project_ref": [], "Linked Projects": [[]]})

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("calendar", "project_ref", "invalid value")], 1)

    def test_project_calendar_ids_must_match_assigned_slots(self):
        data, _ = valid_assigned_export()
        data["projects"][0]["calendar_ids"] = []

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("projects", "calendar_ids", "inconsistent relation")],
            1,
        )

    def test_malformed_calendar_id_is_reported_without_crashing(self):
        data = valid_export()
        data["projects"][0]["calendar_ids"] = [[]]

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("projects", "calendar_ids", "invalid value")], 1)

    def test_valid_assigned_calendar_relation_passes(self):
        data, _ = valid_assigned_export()

        self.assertFalse(ars_dataset.verify(data, self.schema))

    def test_unassigned_slot_requires_null_project_relations(self):
        data = valid_export()
        slot = valid_calendar_entry()
        slot.update({"slot_status": "unassigned"})
        data["calendar"] = [slot]
        data["_meta"]["databases"]["calendar"]["count"] = 1

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("calendar", "project_ref", "invalid value")], 1)
        self.assertEqual(
            violations[("calendar", "Linked Projects", "invalid value")], 1)

    def test_valid_unassigned_slot_passes(self):
        data = valid_export()
        slot = valid_calendar_entry()
        slot.update({
            "slot_status": "unassigned",
            "project_ref": None,
            "Linked Projects": None,
        })
        data["calendar"] = [slot]
        data["_meta"]["databases"]["calendar"]["count"] = 1

        self.assertFalse(ars_dataset.verify(data, self.schema))

    def test_missing_required_record_field_is_rejected(self):
        violations = self.verify(
            lambda data: data["projects"][0].pop("Status Web"))
        self.assertEqual(
            violations[("projects", "Status Web", "missing required field")], 1)

    def test_calendar_datetimes_are_required_and_nullable(self):
        data, slot = valid_assigned_export()
        slot["start_at"] = None
        slot["end_at"] = None
        self.assertFalse(ars_dataset.verify(data, self.schema))

        for field in ("start_at", "end_at"):
            with self.subTest(field=field, case="missing"):
                data, slot = valid_assigned_export()
                slot.pop(field)
                violations = ars_dataset.verify(data, self.schema)
                self.assertEqual(
                    violations[("calendar", field, "missing required field")],
                    1,
                )

            with self.subTest(field=field, case="malformed"):
                data, slot = valid_assigned_export()
                slot[field] = "September 9, 2026 15:15"
                violations = ars_dataset.verify(data, self.schema)
                self.assertEqual(
                    violations[("calendar", field, "invalid value")], 1)

    def test_database_must_be_an_array(self):
        violations = self.verify(lambda data: data.update({"projects": {}}))
        self.assertEqual(
            violations[("<root>", "projects", "invalid value")], 1)

    def test_metadata_field_type_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"].update({"generated_at": 42}))
        self.assertEqual(
            violations[("_meta", "generated_at", "invalid value")], 1)

    def test_nested_metadata_type_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"]["databases"]["projects"].update(
                {"count": True}))
        self.assertEqual(
            violations[("_meta", "databases.projects.count", "invalid value")], 1)

    def test_metadata_database_count_must_match_records(self):
        for mutate in (
                lambda data: data["_meta"]["databases"]["projects"].update(
                    {"count": 999}),
                lambda data: data["projects"].clear()):
            with self.subTest(mutate=mutate):
                violations = self.verify(mutate)
                self.assertEqual(
                    violations[(
                        "_meta", "databases.projects.count",
                        "inconsistent value",
                    )],
                    1,
                )

    def test_metadata_timestamp_format_is_validated(self):
        violations = self.verify(
            lambda data: data["_meta"].update({"generated_at": "not-a-date"}))
        self.assertEqual(
            violations[("_meta", "generated_at", "invalid value")], 1)

    def test_lowercase_rfc3339_timestamp_is_valid(self):
        self.assertFalse(self.verify(
            lambda data: data["_meta"].update(
                {"generated_at": "2026-07-20t07:59:49z"})))

    def test_missing_root_field_is_rejected(self):
        violations = self.verify(lambda data: data.pop("calendar"))
        self.assertEqual(
            violations[("<root>", "calendar", "missing required field")], 1)

    def test_unknown_root_field_is_rejected(self):
        violations = self.verify(
            lambda data: data.update({"unexpected_database": []}))

        self.assertEqual(
            violations[("<root>", "unexpected_database", "unknown field")], 1)

    def test_upstream_internal_index_key_is_rejected(self):
        data = valid_export()
        data["projects"][0]["_key"] = data["projects"][0]["canonical_id"]

        violations = ars_dataset.verify(data, self.schema)

        self.assertEqual(
            violations[("projects", "_key", "unknown field")], 1)

    def test_empty_metadata_is_rejected(self):
        violations = self.verify(lambda data: data.update({"_meta": {}}))

        for field in (
                "source", "website", "author", "generated_at", "encoding",
                "schema_version", "export_filter", "usage", "quality",
                "databases"):
            with self.subTest(field=field):
                self.assertEqual(
                    violations[("_meta", field, "missing required field")], 1)

    def test_metadata_requires_every_database_count(self):
        violations = self.verify(
            lambda data: data["_meta"]["databases"].pop("calendar"))

        self.assertEqual(
            violations[(
                "_meta", "databases.calendar", "missing required field",
            )],
            1,
        )

    def test_conditional_else_and_json_boolean_const_are_enforced(self):
        conditional = {
            "if": {"const": "yes"},
            "then": {"const": "accepted"},
            "else": {"const": "no"},
        }
        self.assertFalse(list(
            ars_dataset._schema_violations(conditional, "no", {})))
        self.assertEqual(
            list(ars_dataset._schema_violations(
                {"const": True}, 1, {})),
            [((), "invalid value")],
        )


class DiffTests(unittest.TestCase):
    def test_metadata_drift_is_reported(self):
        old = {
            "_meta": {
                "generated_at": "2026-07-20T07:59:49.183Z",
                "schema_version": "2.0",
                "export_filter": "all records",
            },
            **{db: [] for db in ars_dataset.DATABASES},
        }
        new = {
            "_meta": {
                "generated_at": "2026-07-23T13:22:00.446Z",
                "schema_version": "2.1",
                "export_filter": "public_for_hackathon = true",
            },
            **{db: [] for db in ars_dataset.DATABASES},
        }

        differences = ars_dataset.diff(old, new)

        self.assertIn(
            "generated_at: 2026-07-20T07:59:49.183Z -> "
            "2026-07-23T13:22:00.446Z",
            differences,
        )
        self.assertIn(
            "export_filter: all records -> public_for_hackathon = true",
            differences,
        )
        self.assertIn("schema_version: 2.0 -> 2.1", differences)

    def test_schema_v1_ids_match_schema_v2_canonical_ids(self):
        canonical_id = "0123456789abcdef0123456789abcdef"
        old = {
            "projects": [{"id": "Project-" + canonical_id}],
            "contacts": [],
            "locations": [],
            "calendar": [],
        }
        new = {
            "projects": [{
                "id": "Project-" + canonical_id,
                "canonical_id": canonical_id,
            }],
            "contacts": [],
            "locations": [],
            "calendar": [],
        }

        differences = ars_dataset.diff(old, new)

        self.assertNotIn("projects: 1 record id(s) added", differences)
        self.assertNotIn("projects: 1 record id(s) removed", differences)

    def test_content_only_record_change_is_reported(self):
        old = valid_export()
        new = copy.deepcopy(old)
        new["projects"][0]["Name EN"] = "Changed title"

        differences = ars_dataset.diff(old, new)

        self.assertIn("projects: 1 record(s) changed", differences)

    def test_diff_does_not_mutate_either_export(self):
        old = valid_export()
        new = copy.deepcopy(old)
        old_before = copy.deepcopy(old)
        new_before = copy.deepcopy(new)

        ars_dataset.diff(old, new)

        self.assertEqual(old, old_before)
        self.assertEqual(new, new_before)


class SummaryTests(unittest.TestCase):
    def test_summary_includes_export_metadata_and_all_supported_relations(self):
        data = valid_export()
        data["_meta"].update({
            "schema_version": "2.0",
            "export_filter": "public_for_hackathon = true",
        })

        output = ars_dataset.summary(data)

        self.assertIn("schema_version: 2.0", output)
        self.assertIn(
            "export_filter: public_for_hackathon = true",
            output,
        )
        for relation in (
                "projects.'Linked Parent' -> projects",
                "projects.'Linked Child' -> projects",
                "locations.'Linked Projects' -> projects",
                "locations.'Linked Parent' -> locations",
                "locations.'Linked Child' -> locations",
                "calendar.'Linked Location' -> locations"):
            with self.subTest(relation=relation):
                self.assertIn(relation, output)


if __name__ == "__main__":
    unittest.main()
