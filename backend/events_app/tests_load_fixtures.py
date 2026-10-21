import json
import os
from pathlib import Path
import stat
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from .management.commands.prepare_card_load_test import Command
from .models import Event, Guest, Invitation


class LoadFixtureTests(TestCase):
    def test_fixture_command_refuses_regular_database_before_writing(self):
        with patch.dict(os.environ, {"APEXECARD_LOAD_TEST_FIXTURES": "true"}):
            with self.assertRaisesMessage(CommandError, "actual database name"):
                call_command("prepare_card_load_test", users=1, guests=1, output="/tmp/unused-fixtures.json")
        self.assertEqual(Event.objects.count(), 0)

    def test_fresh_workloads_have_private_tokens_and_no_generated_cards(self):
        with TemporaryDirectory() as directory, patch.object(Command, "require_isolated_database"):
            output = Path(directory) / "fixtures.json"
            call_command("prepare_card_load_test", users=2, guests=105, iterations=2, output=str(output), verbosity=0)
            fixture = json.loads(output.read_text())
            self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o600)
            self.assertEqual(Event.objects.count(), 4)
            self.assertEqual(Guest.objects.count(), 420)
            self.assertEqual(Invitation.objects.count(), 0)
            self.assertEqual(len({user["user_id"] for user in fixture["users"]}), 2)
            event_ids = set()
            for user in fixture["users"]:
                from rest_framework_simplejwt.tokens import AccessToken
                self.assertEqual(AccessToken(user["access_token"])["user_id"], str(user["user_id"]))
                for work in user["workloads"]:
                    event = Event.objects.get(pk=work["event_id"])
                    self.assertEqual(event.owner_id, user["user_id"])
                    self.assertEqual(set(event.guests.values_list("pk", flat=True)), set(work["guest_ids"]))
                    event_ids.add(event.pk)
            self.assertEqual(len(event_ids), 4)
            with self.assertRaises(CommandError):
                call_command("prepare_card_load_test", users=2, guests=105, output=str(output))
            self.assertEqual(Event.objects.count(), 4)
