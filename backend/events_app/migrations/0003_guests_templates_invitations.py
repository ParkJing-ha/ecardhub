# Generated manually to match events_app model changes.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events_app", "0002_event_dress_code_colors"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CardTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("category", models.CharField(default="Custom Ceremony", max_length=40)),
                ("style", models.CharField(default="Custom", max_length=40)),
                ("primary_color", models.CharField(default="#7A2E45", max_length=7)),
                ("accent_color", models.CharField(default="#C9A24B", max_length=7)),
                ("background_color", models.CharField(default="#FBF7F0", max_length=7)),
                ("text_color", models.CharField(default="#2A1A2E", max_length=7)),
                ("font_family", models.CharField(default="Playfair Display", max_length=80)),
                ("layout", models.CharField(default="centered", max_length=30)),
                ("image_data_url", models.TextField(blank=True)),
                ("is_premium", models.BooleanField(default=False)),
                ("is_custom", models.BooleanField(default=True)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="card_templates", to="events_app.event")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="card_templates", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Guest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=200)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("category", models.CharField(choices=[("Single", "Single"), ("Double/Couple", "Double/Couple"), ("VIP", "VIP")], default="Single", max_length=20)),
                ("invitation_status", models.CharField(choices=[("not_sent", "Not sent"), ("draft", "Draft"), ("queued", "Queued"), ("sent", "Sent"), ("delivered", "Delivered"), ("failed", "Failed")], default="not_sent", max_length=20)),
                ("rsvp_status", models.CharField(choices=[("pending", "Pending"), ("attending", "Attending"), ("not_attending", "Not attending"), ("maybe", "Maybe")], default="pending", max_length=20)),
                ("rsvp_date", models.DateTimeField(blank=True, null=True)),
                ("contribution_status", models.CharField(choices=[("none", "None"), ("pending", "Pending"), ("received", "Received")], default="none", max_length=20)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="guests", to="events_app.event")),
            ],
            options={
                "ordering": ["full_name"],
            },
        ),
        migrations.CreateModel(
            name="Invitation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("guest_name", models.CharField(max_length=200)),
                ("guest_phone", models.CharField(blank=True, max_length=30)),
                ("invitation_code", models.CharField(max_length=40, unique=True)),
                ("qr_data", models.CharField(max_length=80)),
                ("template_id", models.CharField(max_length=80)),
                ("channel", models.CharField(max_length=40)),
                ("package", models.CharField(max_length=80)),
                ("status", models.CharField(default="draft", max_length=20)),
                ("rsvp_status", models.CharField(default="pending", max_length=20)),
                ("customized_text", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="invitations", to="events_app.event")),
                ("guest", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="invitations", to="events_app.guest")),
            ],
            options={
                "ordering": ["guest_name"],
            },
        ),
        migrations.AddConstraint(
            model_name="guest",
            constraint=models.UniqueConstraint(fields=("event", "full_name", "phone"), name="unique_guest_name_phone_per_event"),
        ),
        migrations.AddConstraint(
            model_name="invitation",
            constraint=models.UniqueConstraint(fields=("event", "guest"), name="unique_invitation_per_guest"),
        ),
    ]
