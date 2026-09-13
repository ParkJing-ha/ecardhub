# Generated manually to persist SRS operational records.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events_app", "0003_guests_templates_invitations"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=80)),
                ("entity_type", models.CharField(max_length=80)),
                ("entity_id", models.CharField(max_length=80)),
                ("details", models.TextField(blank=True)),
                ("severity", models.CharField(default="info", max_length=20)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Contribution",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("guest_name", models.CharField(blank=True, max_length=200)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("contribution_type", models.CharField(max_length=40)),
                ("card_type", models.CharField(max_length=30)),
                ("status", models.CharField(default="received", max_length=20)),
                ("reference", models.CharField(max_length=40, unique=True)),
                ("received_date", models.DateTimeField(default=django.utils.timezone.now)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="contributions", to="events_app.event")),
                ("guest", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contributions", to="events_app.guest")),
            ],
            options={
                "ordering": ["-received_date"],
            },
        ),
        migrations.CreateModel(
            name="Usher",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("usher_name", models.CharField(max_length=150)),
                ("usher_email", models.EmailField(blank=True, max_length=254)),
                ("usher_phone", models.CharField(blank=True, max_length=30)),
                ("checkpoints", models.JSONField(blank=True, default=list)),
                ("access_code", models.CharField(blank=True, max_length=30, unique=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("disabled", "Disabled")], default="active", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ushers", to="events_app.event")),
                ("host", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="created_ushers", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["usher_name"],
            },
        ),
        migrations.CreateModel(
            name="WalletTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("direction", models.CharField(choices=[("credit", "Credit"), ("debit", "Debit")], max_length=10)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("provider", models.CharField(blank=True, max_length=40)),
                ("gateway_reference", models.CharField(blank=True, max_length=120)),
                ("status", models.CharField(default="pending", max_length=30)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("event", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="wallet_transactions", to="events_app.event")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="wallet_transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="NotificationLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("channel", models.CharField(max_length=40)),
                ("status", models.CharField(max_length=20)),
                ("recipient", models.CharField(max_length=254)),
                ("message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notification_logs", to="events_app.event")),
                ("guest", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notification_logs", to="events_app.guest")),
                ("invitation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notification_logs", to="events_app.invitation")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="CheckIn",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("guest_name", models.CharField(max_length=200)),
                ("usher_name", models.CharField(blank=True, max_length=150)),
                ("checkpoint", models.CharField(max_length=80)),
                ("status", models.CharField(choices=[("checked_in", "Checked in"), ("rejected", "Rejected")], default="checked_in", max_length=20)),
                ("timestamp", models.DateTimeField(default=django.utils.timezone.now)),
                ("device_id", models.CharField(blank=True, max_length=120)),
                ("synced_at", models.DateTimeField(blank=True, null=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checkins", to="events_app.event")),
                ("guest", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checkins", to="events_app.guest")),
                ("invitation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checkins", to="events_app.invitation")),
                ("usher", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="checkins", to="events_app.usher")),
            ],
            options={
                "ordering": ["-timestamp"],
            },
        ),
        migrations.AddConstraint(
            model_name="checkin",
            constraint=models.UniqueConstraint(fields=("event", "invitation", "checkpoint"), name="unique_invitation_checkin_per_checkpoint"),
        ),
    ]
