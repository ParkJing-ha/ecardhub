from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.crypto import get_random_string


class Event(models.Model):

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class EventType(models.TextChoices):
        WEDDING = "wedding", "Wedding"
        GRADUATION = "graduation", "Graduation"
        BIRTHDAY = "birthday", "Birthday"
        KITCHEN_PARTY = "kitchen_party", "Kitchen Party"
        HOLIDAY = "holiday", "Holiday"
        ANNIVERSARY = "anniversary", "Anniversary"
        SEND_OFF = "send_off", "Send-off"
        CUSTOM_CEREMONY = "custom_ceremony", "Custom Ceremony"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events",
    )

    title = models.CharField(
        max_length=200,
    )

    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
    )

    host_family_name = models.CharField(
        max_length=200,
        blank=True,
    )

    event_date = models.DateField()

    event_time = models.TimeField(
        blank=True,
        null=True,
    )

    venue = models.CharField(
        max_length=255,
    )

    rsvp_deadline = models.DateField(
        blank=True,
        null=True,
    )

    rsvp_reply_phone = models.CharField(
        max_length=20,
        blank=True,
    )

    card_message = models.TextField(
        blank=True,
    )

    dress_code_colors = models.JSONField(
        default=list,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-event_date"]

    def __str__(self):
        return self.title


class Guest(models.Model):

    class Category(models.TextChoices):
        SINGLE = "Single", "Single"
        DOUBLE_COUPLE = "Double/Couple", "Double/Couple"
        VIP = "VIP", "VIP"

    class RSVPStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ATTENDING = "attending", "Attending"
        NOT_ATTENDING = "not_attending", "Not attending"
        MAYBE = "maybe", "Maybe"

    class InvitationStatus(models.TextChoices):
        NOT_SENT = "not_sent", "Not sent"
        DRAFT = "draft", "Draft"
        QUEUED = "queued", "Queued"
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"

    class ContributionStatus(models.TextChoices):
        NONE = "none", "None"
        PENDING = "pending", "Pending"
        RECEIVED = "received", "Received"

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="guests",
    )

    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.SINGLE,
    )
    invitation_status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.NOT_SENT,
    )
    rsvp_status = models.CharField(
        max_length=20,
        choices=RSVPStatus.choices,
        default=RSVPStatus.PENDING,
    )
    rsvp_date = models.DateTimeField(blank=True, null=True)
    contribution_status = models.CharField(
        max_length=20,
        choices=ContributionStatus.choices,
        default=ContributionStatus.NONE,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "full_name", "phone"],
                name="unique_guest_name_phone_per_event",
            )
        ]

    def __str__(self):
        return self.full_name


class CardTemplate(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="card_templates",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="card_templates",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=40, default="Custom Ceremony")
    style = models.CharField(max_length=40, default="Custom")
    primary_color = models.CharField(max_length=7, default="#7A2E45")
    accent_color = models.CharField(max_length=7, default="#C9A24B")
    background_color = models.CharField(max_length=7, default="#FBF7F0")
    text_color = models.CharField(max_length=7, default="#2A1A2E")
    font_family = models.CharField(max_length=80, default="Playfair Display")
    layout = models.CharField(max_length=30, default="centered")
    image_data_url = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Invitation(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    guest = models.ForeignKey(
        Guest,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    guest_name = models.CharField(max_length=200)
    guest_phone = models.CharField(max_length=30, blank=True)
    invitation_code = models.CharField(max_length=40, unique=True)
    qr_data = models.CharField(max_length=80)
    template_id = models.CharField(max_length=80)
    channel = models.CharField(max_length=40)
    package = models.CharField(max_length=80)
    status = models.CharField(max_length=20, default="draft")
    rsvp_status = models.CharField(max_length=20, default="pending")
    customized_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["guest_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "guest"],
                name="unique_invitation_per_guest",
            )
        ]

    def save(self, *args, **kwargs):
        if self.rsvp_status != "pending" and not self.guest.rsvp_date:
            self.guest.rsvp_date = timezone.now()
            self.guest.save(update_fields=["rsvp_date"])
        super().save(*args, **kwargs)

    def __str__(self):
        return self.invitation_code


class Contribution(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="contributions",
    )
    guest = models.ForeignKey(
        Guest,
        on_delete=models.SET_NULL,
        related_name="contributions",
        blank=True,
        null=True,
    )
    guest_name = models.CharField(max_length=200, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    contribution_type = models.CharField(max_length=40)
    card_type = models.CharField(max_length=30)
    status = models.CharField(max_length=20, default="received")
    reference = models.CharField(max_length=40, unique=True)
    received_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-received_date"]

    def save(self, *args, **kwargs):
        if not self.guest_name and self.guest:
            self.guest_name = self.guest.full_name

        if self.status == "received" and self.guest:
            self.guest.contribution_status = Guest.ContributionStatus.RECEIVED
            self.guest.save(update_fields=["contribution_status", "updated_at"])

        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference


class Usher(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DISABLED = "disabled", "Disabled"

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="ushers",
    )
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_ushers",
    )
    usher_name = models.CharField(max_length=150)
    usher_email = models.EmailField(blank=True)
    usher_phone = models.CharField(max_length=30, blank=True)
    checkpoints = models.JSONField(default=list, blank=True)
    access_code = models.CharField(max_length=30, unique=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["usher_name"]

    def save(self, *args, **kwargs):
        if not self.access_code:
            self.access_code = f"USH-{get_random_string(8).upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.usher_name


class CheckIn(models.Model):
    class Status(models.TextChoices):
        CHECKED_IN = "checked_in", "Checked in"
        REJECTED = "rejected", "Rejected"

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="checkins",
    )
    invitation = models.ForeignKey(
        Invitation,
        on_delete=models.CASCADE,
        related_name="checkins",
    )
    guest = models.ForeignKey(
        Guest,
        on_delete=models.CASCADE,
        related_name="checkins",
    )
    usher = models.ForeignKey(
        Usher,
        on_delete=models.SET_NULL,
        related_name="checkins",
        blank=True,
        null=True,
    )
    guest_name = models.CharField(max_length=200)
    usher_name = models.CharField(max_length=150, blank=True)
    checkpoint = models.CharField(max_length=80)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CHECKED_IN,
    )
    timestamp = models.DateTimeField(default=timezone.now)
    device_id = models.CharField(max_length=120, blank=True)
    synced_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "invitation", "checkpoint"],
                name="unique_invitation_checkin_per_checkpoint",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.guest_name:
            self.guest_name = self.guest.full_name
        if not self.usher_name and self.usher:
            self.usher_name = self.usher.usher_name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.guest_name} - {self.checkpoint}"


class NotificationLog(models.Model):
    invitation = models.ForeignKey(
        Invitation,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    guest = models.ForeignKey(
        Guest,
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    channel = models.CharField(max_length=40)
    status = models.CharField(max_length=20)
    recipient = models.CharField(max_length=254)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel} {self.status}"


class WalletTransaction(models.Model):
    class Direction(models.TextChoices):
        CREDIT = "credit", "Credit"
        DEBIT = "debit", "Debit"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet_transactions",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.SET_NULL,
        related_name="wallet_transactions",
        blank=True,
        null=True,
    )
    direction = models.CharField(max_length=10, choices=Direction.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    provider = models.CharField(max_length=40, blank=True)
    gateway_reference = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=30, default="pending")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.direction} {self.amount}"


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        blank=True,
        null=True,
    )
    action = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80)
    details = models.TextField(blank=True)
    severity = models.CharField(max_length=20, default="info")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.action
