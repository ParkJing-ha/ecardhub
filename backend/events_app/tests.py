from datetime import date
import base64
from concurrent.futures import ThreadPoolExecutor
import json
import threading
from unittest.mock import patch
from xml.etree import ElementTree as ET

from django.contrib.auth import get_user_model
from django.db import close_old_connections, connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase, APITransactionTestCase

from .models import CardGenerationSnapshot, CardTemplate, Event, Guest, Invitation, NotificationLog


class GuestEventIsolationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            email="owner@example.com",
            full_name="Event Owner",
            phone_number="255700000000",
            password="test-password",
        )
        self.client.force_authenticate(user=self.owner)
        self.event_one = Event.objects.create(
            owner=self.owner,
            title="First Event",
            event_type=Event.EventType.WEDDING,
            event_date=date(2026, 1, 1),
            venue="Venue One",
        )
        self.event_two = Event.objects.create(
            owner=self.owner,
            title="Second Event",
            event_type=Event.EventType.BIRTHDAY,
            event_date=date(2026, 2, 1),
            venue="Venue Two",
        )
        self.event_one_guest = Guest.objects.create(
            event=self.event_one,
            full_name="Guest One",
            phone="255700000001",
        )
        self.event_two_guest = Guest.objects.create(
            event=self.event_two,
            full_name="Guest Two",
            phone="255700000002",
        )

    def test_guests_cannot_cross_event_boundaries(self):
        list_response = self.client.get(
            f"/api/events/{self.event_one.pk}/guests/"
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            [guest["id"] for guest in list_response.data],
            [self.event_one_guest.pk],
        )

        guest_two_url = (
            f"/api/events/{self.event_one.pk}/guests/{self.event_two_guest.pk}/"
        )
        self.assertEqual(self.client.get(guest_two_url).status_code, 404)
        self.assertEqual(
            self.client.patch(guest_two_url, {"full_name": "Changed"}).status_code,
            404,
        )
        self.assertEqual(self.client.delete(guest_two_url).status_code, 404)

        self.event_two_guest.refresh_from_db()
        self.assertEqual(self.event_two_guest.full_name, "Guest Two")

    def test_card_management_can_list_and_create_invitations(self):
        url = f"/api/events/{self.event_one.pk}/invitations/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

        payload = {
            "guest_id": self.event_one_guest.pk,
            "guest_name": self.event_one_guest.full_name,
            "invitation_code": "INV-CARD-MANAGEMENT",
            "qr_data": "INV-CARD-MANAGEMENT",
            "template_id": "preset-0",
            "channel": "whatsapp",
            "package": "standard",
        }
        created = self.client.post(url, [payload], format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(len(created.data), 1)

        listed = self.client.get(url)
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data[0]["invitation_code"], payload["invitation_code"])

        # An event's cards must not accept a guest from a different event.
        invalid = {**payload, "guest_id": self.event_two_guest.pk,
                   "invitation_code": "INV-CROSS-EVENT"}
        self.assertEqual(self.client.post(url, invalid, format="json").status_code, 400)
        self.assertEqual(self.client.get(f"/api/events/{self.event_two.pk}/invitations/").data, [])

    def test_event_dashboard_guest_card_and_related_lists(self):
        base = f"/api/events/{self.event_one.pk}"
        guest = self.client.post(f"{base}/guests/", {
            "full_name": "Dashboard Guest", "phone": "255700000003",
        }, format="json")
        self.assertEqual(guest.status_code, 201)
        cards = self.client.post(f"{base}/invitations/", [{
            "guest_id": guest.data["id"], "guest_name": "Dashboard Guest",
            "invitation_code": "INV-FLOW", "qr_data": "INV-FLOW",
            "template_id": "preset-0", "channel": "whatsapp", "package": "whatsapp",
        }], format="json")
        self.assertEqual(cards.status_code, 201)
        self.assertEqual(len(self.client.get(f"{base}/invitations/").data), 1)
        contribution = self.client.post(f"{base}/contributions/", {
            "guest_id": guest.data["id"], "amount": "1000.00",
            "contribution_type": "cash", "card_type": "standard", "reference": "FLOW-1",
        }, format="json")
        self.assertEqual(contribution.status_code, 201)
        checkin = self.client.post(f"{base}/checkins/", {
            "invitation_id": cards.data[0]["id"], "checkpoint": "entrance",
        }, format="json")
        self.assertEqual(checkin.status_code, 201)
        for endpoint in ["contributions", "checkins"]:
            response = self.client.get(f"{base}/{endpoint}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.data), 1)


class BulkCardGenerationTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            email="cards@example.com", full_name="Card Owner",
            phone_number="255700000010", password="test-password",
        )
        self.other_owner = user_model.objects.create_user(
            email="othercards@example.com", full_name="Other Owner",
            phone_number="255700000011", password="test-password",
        )
        self.client.force_authenticate(user=self.owner)
        self.event = Event.objects.create(
            owner=self.owner, title="Clara & Daniel Wedding",
            event_type=Event.EventType.WEDDING, event_date=date(2027, 1, 1),
            venue="Garden <Hall>", card_message="Join our celebration!",
        )
        self.other_event = Event.objects.create(
            owner=self.other_owner, title="Private Event",
            event_type=Event.EventType.BIRTHDAY, event_date=date(2027, 2, 1), venue="Other Venue",
        )
        self.guests = [Guest.objects.create(
            event=self.event, full_name=name, phone=f"25570000002{index}",
        ) for index, name in enumerate(["Amina & Family", "John <Doe>", "Mary Smith"])]
        self.template = CardTemplate.objects.create(
            owner=self.owner, event=self.event, name="Saved Wedding Design",
            primary_color="#713A56", accent_color="#CFAC72", layout="centered",
        )
        self.url = f"/api/events/{self.event.pk}/invitations/generate/"

    def test_bulk_creates_finished_unique_cards_without_sending(self):
        response = self.client.post(self.url, {
            "guest_ids": [guest.pk for guest in self.guests],
            "template_id": self.template.pk,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 3)
        self.assertEqual(response.data["existing_count"], 0)
        codes = [card["invitation_code"] for card in response.data["invitations"]]
        self.assertEqual(len(set(codes)), 3)
        for summary in response.data["invitations"]:
            self.assertTrue(summary["has_card_artifact"])
            self.assertEqual(summary["card_svg"], "")
            self.assertEqual(summary["qr_svg"], "")
            card = self.client.get(
                f"/api/events/{self.event.pk}/invitations/{summary['id']}/"
            ).data
            self.assertRegex(card["invitation_code"], r"^CARD-[0-9A-F]{32}$")
            self.assertEqual(card["qr_data"], card["invitation_code"])
            self.assertEqual(card["status"], "draft")
            self.assertEqual(card["card_snapshot"]["event"]["title"], self.event.title)
            self.assertEqual(card["card_snapshot"]["template"]["id"], self.template.pk)
            self.assertEqual(card["card_snapshot"]["guest"]["full_name"], card["guest_name"])
            self.assertTrue(card["qr_image_data_url"].startswith("data:image/svg+xml;base64,"))
            ET.fromstring(card["qr_svg"])
            artifact = ET.fromstring(card["card_svg"])
            self.assertEqual(artifact.attrib["viewBox"], "0 0 600 800")
            text = " ".join(artifact.itertext())
            self.assertIn(card["guest_name"], text)
            self.assertIn(self.event.title, text)
            self.assertIn(self.event.venue, text)
            self.assertIn(card["invitation_code"], text)
            self.assertNotIn("<script", card["card_svg"])
            self.assertNotIn("qrserver", card["card_svg"])
        self.assertEqual(CardGenerationSnapshot.objects.count(), 1)
        self.assertEqual(NotificationLog.objects.count(), 0)
        self.assertEqual(set(self.event.guests.values_list("invitation_status", flat=True)), {"draft"})

    def test_retry_preserves_card_ids_snapshots_and_artifacts(self):
        first = self.client.post(self.url, {"all_guests": True}, format="json")
        self.assertEqual(first.status_code, 201)
        self.event.title = "Changed event"
        self.event.save()
        self.template.primary_color = "#000000"
        self.template.save()
        self.guests[0].full_name = "Changed guest"
        self.guests[0].save()
        repeated = self.client.post(self.url, {"all_guests": True}, format="json")
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.data["created_count"], 0)
        self.assertEqual(repeated.data["existing_count"], 3)
        before = {card["id"]: card for card in first.data["invitations"]}
        after = {card["id"]: card for card in repeated.data["invitations"]}
        self.assertEqual(before, after)
        listed = self.client.get(f"/api/events/{self.event.pk}/invitations/")
        self.assertEqual({card["id"]: card for card in listed.data}, before)
        self.assertEqual(CardGenerationSnapshot.objects.count(), 1)

    def test_invalid_guest_batch_is_atomic_and_private_events_are_hidden(self):
        other_guest = Guest.objects.create(event=self.other_event, full_name="Other guest")
        invalid = self.client.post(self.url, {
            "guest_ids": [self.guests[0].pk, other_guest.pk],
        }, format="json")
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(Invitation.objects.count(), 0)
        self.assertEqual(CardGenerationSnapshot.objects.count(), 0)
        private = self.client.post(
            f"/api/events/{self.other_event.pk}/invitations/generate/",
            {"all_guests": True}, format="json",
        )
        self.assertEqual(private.status_code, 404)

    def test_only_event_owned_saved_templates_can_generate_cards(self):
        global_design = CardTemplate.objects.create(owner=self.owner, name="Not saved to event")
        other_design = CardTemplate.objects.create(
            owner=self.other_owner, event=self.other_event, name="Private design",
        )
        for template_id in [global_design.pk, other_design.pk, 999999]:
            response = self.client.post(self.url, {
                "all_guests": True, "template_id": template_id,
            }, format="json")
            self.assertEqual(response.status_code, 400)
        self.template.delete()
        self.assertEqual(self.client.post(self.url, {"all_guests": True}, format="json").status_code, 400)
        self.assertEqual(Invitation.objects.count(), 0)

    def test_selection_limits_and_invalid_inputs_create_nothing(self):
        cases = [{}, {"guest_ids": []}, {"guest_ids": [0]},
                 {"guest_ids": [self.guests[0].pk] * 101},
                 {"guest_ids": [self.guests[0].pk] * 2},
                 {"guest_ids": [self.guests[0].pk], "all_guests": True}]
        for payload in cases:
            self.assertEqual(self.client.post(self.url, payload, format="json").status_code, 400)
        Guest.objects.bulk_create([
            Guest(event=self.event, full_name=f"Bulk Guest {index}") for index in range(101)
        ])
        self.assertEqual(self.client.post(self.url, {"all_guests": True}, format="json").status_code, 400)
        self.assertEqual(Invitation.objects.count(), 0)

    def test_generation_requires_authentication(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.post(self.url, {"all_guests": True}, format="json").status_code, 401)

    def test_large_backgrounds_are_only_returned_for_owned_card_detail(self):
        # A tiny valid PNG with trailing padding represents a large upload.
        png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6tKAAAAAASUVORK5CYII=")
        image = "data:image/png;base64," + base64.b64encode(png + b"\0" * 100000).decode()
        self.template.image_data_url = image
        self.template.save()
        generated = self.client.post(self.url, {"all_guests": True}, format="json")
        self.assertEqual(generated.status_code, 201)
        listed = self.client.get(f"/api/events/{self.event.pk}/invitations/")
        for response in [generated, listed]:
            self.assertLess(len(json.dumps(response.data)), 10000)
            self.assertNotIn(image, json.dumps(response.data))
        summary = generated.data["invitations"][0]
        self.assertTrue(summary["card_snapshot"]["template"]["image_data_url_available"])
        detail_url = f"/api/events/{self.event.pk}/invitations/{summary['id']}/"
        detail = self.client.get(detail_url)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["card_snapshot"]["template"]["image_data_url"], image)
        self.assertIn(image, detail.data["card_svg"])
        self.assertNotIn(self.event.title, " ".join(ET.fromstring(detail.data["card_svg"]).itertext()))
        self.assertEqual(self.client.get(
            f"/api/events/{self.other_event.pk}/invitations/{summary['id']}/"
        ).status_code, 404)
        self.client.force_authenticate(user=self.other_owner)
        self.assertEqual(self.client.get(detail_url).status_code, 404)
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(detail_url).status_code, 401)

    def test_chunks_share_design_snapshot_and_template_deletion_preserves_cards(self):
        first = self.client.post(self.url, {"guest_ids": [self.guests[0].pk]}, format="json")
        second = self.client.post(self.url, {"guest_ids": [self.guests[1].pk]}, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(CardGenerationSnapshot.objects.count(), 1)
        detail_url = f"/api/events/{self.event.pk}/invitations/{first.data['invitations'][0]['id']}/"
        artifact = self.client.get(detail_url).data["card_svg"]
        self.template.delete()
        self.assertEqual(self.client.get(detail_url).data["card_svg"], artifact)
        # Cascading event deletion may delete the cards and snapshot together.
        self.event.delete()
        self.assertEqual(CardGenerationSnapshot.objects.count(), 0)
        self.assertEqual(Invitation.objects.count(), 0)


class GuestImportLimitTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            email="imports@example.com", full_name="Import Owner",
            phone_number="255700000100", password="test-password",
        )
        self.other_owner = user_model.objects.create_user(
            email="privateimports@example.com", full_name="Private Owner",
            phone_number="255700000101", password="test-password",
        )
        self.client.force_authenticate(user=self.owner)
        self.event = Event.objects.create(
            owner=self.owner, title="Guest Import Event",
            event_type=Event.EventType.WEDDING, event_date=date(2027, 1, 1), venue="Import Hall",
        )
        self.other_event = Event.objects.create(
            owner=self.other_owner, title="Private Guest Event",
            event_type=Event.EventType.BIRTHDAY, event_date=date(2027, 1, 1), venue="Private Hall",
        )
        self.url = f"/api/events/{self.event.pk}/guests/"

    def seed_guests(self, count):
        return Guest.objects.bulk_create([
            Guest(event=self.event, full_name=f"Existing Guest {index}", phone=f"0700{index:06}")
            for index in range(count)
        ])

    def test_import_500_guests_preserves_contacts_and_category(self):
        payload = [{"full_name": f"Imported Guest {index}", "phone": f"0701{index:06}",
                    "email": f"guest{index}@example.com", "category": "Double/Couple"}
                   for index in range(500)]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data), 500)
        self.assertEqual(self.event.guests.count(), 500)
        self.assertEqual(response.data[0]["phone"], "0701000000")
        self.assertEqual(response.data[0]["category"], "Double/Couple")
        self.assertEqual(len(set(row["id"] for row in response.data)), 500)
        self.assertTrue(all(row["event"] == self.event.pk for row in response.data))

    def test_guest_capacity_rejects_501_and_over_capacity_batches_atomically(self):
        payload = [{"full_name": f"Imported Guest {index}"} for index in range(501)]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "event_guest_limit_exceeded")
        self.assertEqual(response.data["limit"], 500)
        self.assertEqual(response.data["remaining_count"], 500)
        self.assertEqual(self.event.guests.count(), 0)
        self.seed_guests(499)
        overfull = self.client.post(self.url, [
            {"full_name": "First New Guest"}, {"full_name": "Second New Guest"},
        ], format="json")
        self.assertEqual(overfull.status_code, 409)
        self.assertEqual(overfull.data["current_count"], 499)
        self.assertEqual(overfull.data["requested_count"], 2)
        self.assertEqual(overfull.data["remaining_count"], 1)
        self.assertEqual(self.event.guests.count(), 499)

    def test_last_single_slot_is_available_but_legacy_overflow_is_preserved(self):
        self.seed_guests(499)
        self.assertEqual(self.client.post(self.url, {"full_name": "Last Guest"}, format="json").status_code, 201)
        rejected = self.client.post(self.url, {"full_name": "Guest 501"}, format="json")
        self.assertEqual(rejected.status_code, 409)
        self.assertEqual(rejected.data["remaining_count"], 0)
        Guest.objects.create(event=self.event, full_name="Legacy Guest 501")
        self.assertEqual(self.client.post(self.url, {"full_name": "Another Guest"}, format="json").status_code, 409)
        self.assertEqual(self.event.guests.count(), 501)
        self.assertEqual(len(self.client.get(self.url).data), 501)

    def test_invalid_and_duplicate_rows_never_partially_import(self):
        invalid = self.client.post(self.url, [
            {"full_name": "Valid First Guest"},
            {"full_name": "Invalid Second Guest", "email": "invalid-email"},
        ], format="json")
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(invalid.data["code"], "invalid_guest_rows")
        self.assertEqual(invalid.data["errors"][0]["row"], 2)
        self.assertIn("email", invalid.data["errors"][0]["fields"])
        self.assertEqual(self.event.guests.count(), 0)
        duplicate = self.client.post(self.url, [
            {"full_name": "Duplicate Guest", "phone": "0701000000"},
            {"full_name": " Duplicate Guest ", "phone": "0701000000"},
        ], format="json")
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(duplicate.data["errors"][0]["row"], 2)
        self.assertEqual(self.event.guests.count(), 0)
        self.seed_guests(1)
        existing = self.client.post(self.url, [
            {"full_name": "New Guest"}, {"full_name": "Existing Guest 0", "phone": "0700000000"},
        ], format="json")
        self.assertEqual(existing.status_code, 400)
        self.assertEqual(self.event.guests.count(), 1)
        self.assertEqual(self.client.post(self.url, [], format="json").status_code, 400)

    def test_imports_cannot_cross_owner_boundaries(self):
        private_url = f"/api/events/{self.other_event.pk}/guests/"
        for payload in [{"full_name": "Invalid Guest"}, [{"full_name": "Invalid Guest"}]]:
            self.assertEqual(self.client.post(private_url, payload, format="json").status_code, 404)
        injected = self.client.post(self.url, [{
            "full_name": "Owned Guest", "event": self.other_event.pk,
        }], format="json")
        self.assertEqual(injected.status_code, 201)
        self.assertEqual(injected.data[0]["event"], self.event.pk)
        self.assertEqual(self.other_event.guests.count(), 0)

    def test_cards_cap_at_500_and_existing_cards_can_be_retried(self):
        guests = self.seed_guests(501)
        CardTemplate.objects.create(owner=self.owner, event=self.event, name="Saved Design")
        Invitation.objects.bulk_create([Invitation(
            event=self.event, guest=guest, guest_name=guest.full_name,
            invitation_code=f"CARD-EXISTING-{index}", qr_data=f"CARD-EXISTING-{index}",
            template_id="legacy", channel="whatsapp", package="standard",
        ) for index, guest in enumerate(guests[:499])])
        generation_url = f"/api/events/{self.event.pk}/invitations/generate/"
        last = self.client.post(generation_url, {"guest_ids": [guests[499].pk]}, format="json")
        self.assertEqual(last.status_code, 201)
        self.assertEqual(self.event.invitations.count(), 500)
        overflow = self.client.post(generation_url, {"guest_ids": [guests[500].pk]}, format="json")
        self.assertEqual(overflow.status_code, 409)
        self.assertEqual(overflow.data["code"], "event_card_limit_exceeded")
        self.assertEqual(overflow.data["remaining_count"], 0)
        self.assertEqual(self.event.invitations.count(), 500)
        retry = self.client.post(generation_url, {"guest_ids": [guests[499].pk]}, format="json")
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(retry.data["created_count"], 0)

    def test_legacy_card_create_cannot_bypass_cap_and_validates_before_writing(self):
        guests = self.seed_guests(501)
        Invitation.objects.bulk_create([Invitation(
            event=self.event, guest=guest, guest_name=guest.full_name,
            invitation_code=f"CARD-MANUAL-{index}", qr_data=f"CARD-MANUAL-{index}",
            template_id="legacy", channel="whatsapp", package="standard",
        ) for index, guest in enumerate(guests[:499])])
        url = f"/api/events/{self.event.pk}/invitations/"
        payload = [{"guest_id": guest.pk, "guest_name": guest.full_name,
                    "invitation_code": f"CARD-NEW-{index}", "qr_data": f"CARD-NEW-{index}",
                    "template_id": "legacy", "channel": "whatsapp", "package": "standard"}
                   for index, guest in enumerate(guests[499:])]
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 409)
        self.assertEqual(self.event.invitations.count(), 499)
        invalid = [{**payload[0]}, {**payload[1], "guest_id": 999999}]
        self.assertEqual(self.client.post(url, invalid, format="json").status_code, 400)
        self.assertEqual(self.event.invitations.count(), 499)


class ConcurrentGuestImportLimitTests(APITransactionTestCase):
    def test_single_and_bulk_import_share_last_slot_safely(self):
        owner = get_user_model().objects.create_user(
            email="concurrentimports@example.com", full_name="Concurrent Owner",
            phone_number="255700000102", password="test-password",
        )
        event = Event.objects.create(
            owner=owner, title="Concurrent Imports",
            event_type=Event.EventType.WEDDING, event_date=date(2027, 1, 1), venue="Hall",
        )
        Guest.objects.bulk_create([Guest(event=event, full_name=f"Existing {index}") for index in range(499)])
        barrier = threading.Barrier(2)

        def add_guest(payload):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(user=owner)
                barrier.wait(timeout=10)
                return client.post(f"/api/events/{event.pk}/guests/", payload, format="json").status_code
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            first = executor.submit(add_guest, {"full_name": "Single Guest"})
            second = executor.submit(add_guest, [{"full_name": "Imported Guest"}])
            results = [first.result(timeout=20), second.result(timeout=20)]
        self.assertEqual(sorted(results), [201, 409])
        self.assertEqual(event.guests.count(), 500)


class CardGenerationLoadRegressionTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            email="load-regression@example.com", full_name="Load Owner",
            phone_number="255700000104", password="test-password",
        )
        self.client.force_authenticate(self.owner)
        self.event = Event.objects.create(
            owner=self.owner, title="Load Regression", event_type=Event.EventType.WEDDING,
            event_date=date(2027, 1, 1), venue="Hall",
        )
        self.template = CardTemplate.objects.create(
            owner=self.owner, event=self.event, name="Uploaded Design",
            image_data_url="data:image/png;base64," + "A" * 262144,
        )
        self.guests = Guest.objects.bulk_create([
            Guest(event=self.event, full_name=f"Guest {index:03}") for index in range(100)
        ])
        self.url = f"/api/events/{self.event.pk}/invitations/generate/"
        self.payload = {"guest_ids": [guest.pk for guest in self.guests]}

    def test_100_cards_use_bounded_queries_and_one_shared_snapshot(self):
        with CaptureQueriesContext(connection) as queries:
            response = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 100)
        # Enough slack for transactional/auth changes, but catches per-card DB work.
        self.assertLessEqual(len(queries), 20)
        self.assertEqual(self.event.card_generations.count(), 1)
        for method, url, payload in [
            ("post", self.url, self.payload),
            ("get", f"/api/events/{self.event.pk}/invitations/", None),
        ]:
            with CaptureQueriesContext(connection) as reads:
                result = getattr(self.client, method)(url, payload, format="json")
            self.assertEqual(result.status_code, 200)
            self.assertLessEqual(len(reads), 15)
            # Joining a shared 2MB image once per guest turns a 500-card request
            # into gigabytes of repeated DB data despite a compact API response.
            card_selects = [q["sql"] for q in reads if q["sql"].startswith("SELECT")
                            and 'FROM "events_app_invitation"' in q["sql"]]
            self.assertTrue(card_selects)
            self.assertTrue(all('"template_data"' not in sql for sql in card_selects))
        detail = self.client.get(
            f"/api/events/{self.event.pk}/invitations/{response.data['invitations'][0]['id']}/"
        )
        self.assertEqual(detail.data["card_snapshot"]["template"]["image_data_url"], self.template.image_data_url)

    def test_bulk_generation_preserves_pending_and_existing_rsvp_dates(self):
        original_date = timezone.now()
        Guest.objects.filter(pk=self.guests[0].pk).update(rsvp_status="attending")
        Guest.objects.filter(pk=self.guests[1].pk).update(rsvp_status="maybe", rsvp_date=original_date)
        result = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(result.status_code, 201)
        for guest in self.guests[:3]:
            guest.refresh_from_db()
        self.assertIsNotNone(self.guests[0].rsvp_date)
        self.assertEqual(self.guests[1].rsvp_date, original_date)
        self.assertIsNone(self.guests[2].rsvp_date)
        assigned = self.guests[0].rsvp_date
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 200)
        self.guests[0].refresh_from_db()
        self.assertEqual(self.guests[0].rsvp_date, assigned)


class ConcurrentCardGenerationTests(APITransactionTestCase):
    def test_competing_batches_return_the_same_100_card_ids(self):
        owner = get_user_model().objects.create_user(
            email="concurrent-cards@example.com", full_name="Concurrent Cards",
            phone_number="255700000105", password="test-password",
        )
        event = Event.objects.create(
            owner=owner, title="Concurrent Cards", event_type=Event.EventType.WEDDING,
            event_date=date(2027, 1, 1), venue="Hall",
        )
        CardTemplate.objects.create(owner=owner, event=event, name="Shared Design")
        guests = Guest.objects.bulk_create([Guest(event=event, full_name=f"Guest {i:03}") for i in range(100)])
        barrier = threading.Barrier(2)

        def generate():
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(user=owner)
                barrier.wait(timeout=10)
                response = client.post(f"/api/events/{event.pk}/invitations/generate/",
                                       {"guest_ids": [guest.pk for guest in guests]}, format="json")
                return response.status_code, {card["guest_id"]: card["invitation_code"]
                                              for card in response.data["invitations"]}
            finally:
                connection.close()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(generate) for _ in range(2)]
            results = [future.result(timeout=30) for future in futures]
        self.assertEqual(sorted(result[0] for result in results), [200, 201])
        self.assertEqual(results[0][1], results[1][1])
        self.assertEqual(len(set(results[0][1].values())), 100)
        self.assertEqual(event.invitations.count(), 100)
        self.assertEqual(event.card_generations.count(), 1)


class RuntimeReadinessTests(APITestCase):
    def test_readiness_reports_database_failure_without_details(self):
        self.assertEqual(self.client.get("/health/").json(), {"status": "ok"})
        from django.db import OperationalError
        with patch("config.health.connection.cursor", side_effect=OperationalError("private details")):
            response = self.client.get("/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
