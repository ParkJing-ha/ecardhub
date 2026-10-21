"""Check persisted load-test results after the timed HTTP workload."""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db.models import F

from events_app.models import Event, Invitation
from .prepare_card_load_test import Command as FixtureCommand


class Command(BaseCommand):
    help = "Verify persisted results of fresh synthetic card-generation workloads."

    def add_arguments(self, parser):
        parser.add_argument("--fixtures", required=True)
        parser.add_argument("--users", type=int, default=1000)
        parser.add_argument("--iterations", type=int, default=1)
        parser.add_argument("--offset", type=int, default=0)

    def handle(self, *args, **options):
        FixtureCommand().require_isolated_database()
        records = json.loads(Path(options["fixtures"]).read_text())["users"]
        offset, count, iterations = options["offset"], options["users"], options["iterations"]
        if count < 1 or offset < 0 or iterations < 1 or len(records) < offset + count:
            raise CommandError("Invalid fixture selection.")
        expected = 0
        for user in records[offset:offset + count]:
            if len(user["workloads"]) < iterations:
                raise CommandError("Missing iteration fixture.")
            for work in user["workloads"][:iterations]:
                event = Event.objects.get(pk=work["event_id"], owner_id=user["user_id"])
                cards = Invitation.objects.filter(event=event)
                if set(cards.values_list("guest_id", flat=True)) != set(work["guest_ids"]):
                    raise CommandError(f"Event {event.pk}: missing or unexpected guest cards.")
                if cards.count() != len(work["guest_ids"]):
                    raise CommandError(f"Event {event.pk}: duplicate or missing cards.")
                if cards.exclude(qr_data=F("invitation_code")).exists() or cards.filter(card_generation__isnull=True).exists():
                    raise CommandError(f"Event {event.pk}: invalid QR or missing saved design snapshot.")
                if cards.exclude(card_generation__template_id=work["template_id"]).exists():
                    raise CommandError(f"Event {event.pk}: unexpected saved design.")
                expected += len(work["guest_ids"])
        # Database uniqueness constraints additionally enforce global card IDs and
        # one card per event/guest; the HTTP test checks returned IDs and artifacts.
        self.stdout.write(self.style.SUCCESS(f"Verified {count * iterations} events and {expected} persisted cards."))
