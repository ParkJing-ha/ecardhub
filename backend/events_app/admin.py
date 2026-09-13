from django.contrib import admin

from .models import (
    AuditLog,
    CardTemplate,
    CheckIn,
    Contribution,
    Event,
    Guest,
    Invitation,
    NotificationLog,
    Usher,
    WalletTransaction,
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "event_type", "event_date", "status")
    list_filter = ("event_type", "status", "event_date")
    search_fields = ("title", "owner__email", "venue")


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ("full_name", "event", "phone", "email", "category", "rsvp_status")
    list_filter = ("category", "invitation_status", "rsvp_status")
    search_fields = ("full_name", "phone", "email", "event__title")


@admin.register(CardTemplate)
class CardTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "event", "category", "is_custom")
    list_filter = ("category", "is_custom", "is_premium")
    search_fields = ("name", "owner__email", "event__title")


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("invitation_code", "event", "guest_name", "channel", "status")
    list_filter = ("channel", "status", "rsvp_status")
    search_fields = ("invitation_code", "guest_name", "event__title")


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ("reference", "event", "guest_name", "amount", "status", "received_date")
    list_filter = ("status", "contribution_type", "card_type")
    search_fields = ("reference", "guest_name", "event__title")


@admin.register(Usher)
class UsherAdmin(admin.ModelAdmin):
    list_display = ("usher_name", "event", "usher_phone", "usher_email", "status")
    list_filter = ("status",)
    search_fields = ("usher_name", "usher_phone", "usher_email", "event__title")


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "event", "checkpoint", "usher_name", "status", "timestamp")
    list_filter = ("checkpoint", "status", "timestamp")
    search_fields = ("guest_name", "usher_name", "invitation__invitation_code")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("event", "channel", "status", "recipient", "created_at")
    list_filter = ("channel", "status", "created_at")
    search_fields = ("recipient", "guest__full_name", "event__title")


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ("owner", "direction", "amount", "provider", "status", "created_at")
    list_filter = ("direction", "provider", "status")
    search_fields = ("owner__email", "gateway_reference")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("actor", "action", "entity_type", "entity_id", "severity", "created_at")
    list_filter = ("action", "severity", "created_at")
    search_fields = ("actor__email", "action", "entity_type", "entity_id")
