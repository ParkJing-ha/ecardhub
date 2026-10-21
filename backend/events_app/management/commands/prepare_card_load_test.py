"""Create fresh synthetic workloads in a dedicated, explicitly enabled database."""

import base64
from datetime import date, timedelta
import json
import os
from pathlib import Path
import uuid

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from rest_framework_simplejwt.tokens import AccessToken

from events_app.models import CardTemplate, Event, Guest


class Command(BaseCommand):
    help = "Create fresh card-generation load fixtures in an isolated load-test database."

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=1000)
        parser.add_argument("--guests", type=int, default=500)
        parser.add_argument("--iterations", type=int, default=1)
        parser.add_argument("--output", required=True)
        parser.add_argument("--image-path", help="Optional representative PNG/JPG/WEBP, at most 2 MB.")
        parser.add_argument("--token-minutes", type=int, default=120)

    def require_isolated_database(self):
        if os.getenv("APEXECARD_LOAD_TEST_FIXTURES", "").lower() != "true":
            raise CommandError("Set APEXECARD_LOAD_TEST_FIXTURES=true only on the isolated load-test stack.")
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_database()")
            actual_name = cursor.fetchone()[0]
        if not actual_name.startswith("apexecard_loadtest_"):
            raise CommandError("Refusing fixture writes: actual database name must start with apexecard_loadtest_.")

    def handle(self, *args, **options):
        self.require_isolated_database()
        users, guests, iterations = options["users"], options["guests"], options["iterations"]
        if not 1 <= users <= 1000 or not 1 <= guests <= 500 or not 1 <= iterations <= 100:
            raise CommandError("Use 1–1000 users, 1–500 guests and 1–100 iterations.")
        if not 1 <= options["token_minutes"] <= 1440:
            raise CommandError("Token lifetime must be 1–1440 minutes.")
        output = Path(options["output"])
        image_data_url = ""
        if options["image_path"]:
            image_path = Path(options["image_path"])
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}.get(image_path.suffix.lower())
            if not mime or image_path.stat().st_size > 2 * 1024 * 1024:
                raise CommandError("Use a PNG/JPG/WEBP image of at most 2 MB.")
            image_data_url = f"data:{mime};base64," + base64.b64encode(image_path.read_bytes()).decode("ascii")
        run_id = uuid.uuid4().hex
        # Reserve a private output file first; never overwrite another run's tokens.
        try:
            fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except OSError as exc:
            raise CommandError("Choose a new output file in an existing private directory.") from exc
        try:
            with os.fdopen(fd, "w") as stream, transaction.atomic():
                records = []
                for index in range(users):
                    user = get_user_model()(
                        email=f"load-{run_id}-{index}@example.invalid",
                        full_name=f"Load Test User {index}",
                        phone_number=f"lt{run_id[:10]}{index:04}",
                    )
                    user.set_unusable_password()
                    user.save()
                    token = AccessToken.for_user(user)
                    token.set_exp(lifetime=timedelta(minutes=options["token_minutes"]))
                    workloads = []
                    for iteration in range(iterations):
                        event = Event.objects.create(
                            owner=user, title=f"Load {run_id[:8]} {index} {iteration}",
                            event_type=Event.EventType.WEDDING,
                            event_date=date(2027, 1, 1), venue="Synthetic Test Venue",
                            card_message="Load test invitation",
                        )
                        template = CardTemplate.objects.create(
                            owner=user, event=event, name="Load Test Design", image_data_url=image_data_url,
                        )
                        members = Guest.objects.bulk_create([
                            Guest(event=event, full_name=f"Test Guest {guest:03}",
                                  phone=f"0700{guest:06}", email=f"guest{guest}@example.invalid")
                            for guest in range(guests)
                        ], batch_size=500)
                        workloads.append({"event_id": event.pk, "template_id": template.pk,
                                          "guest_ids": [guest.pk for guest in members]})
                    records.append({"user_id": user.pk, "access_token": str(token), "workloads": workloads})
                json.dump({"run_id": run_id, "users": records}, stream, separators=(",", ":"))
                stream.flush()
                os.fsync(stream.fileno())
        except BaseException:
            output.unlink(missing_ok=True)
            raise
        self.stdout.write(self.style.SUCCESS(
            f"Prepared {users} users × {iterations} fresh events × {guests} guests. "
            f"Private fixture file: {output}. Run each workload once; do not commit tokens."
        ))
