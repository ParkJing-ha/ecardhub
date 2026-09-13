# Generated manually for SRS role-based access support.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("super_admin", "Super Admin"),
                    ("event_host", "Event Host"),
                    ("usher", "Usher"),
                ],
                default="event_host",
                max_length=30,
            ),
        ),
    ]
