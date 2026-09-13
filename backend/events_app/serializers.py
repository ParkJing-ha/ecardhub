import re

from rest_framework import serializers

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


HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "event_type",
            "host_family_name",
            "event_date",
            "event_time",
            "venue",
            "rsvp_deadline",
            "rsvp_reply_phone",
            "card_message",
            "dress_code_colors",
            "description",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_dress_code_colors(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "Dress code colors must be a list of Hex colors."
            )

        for color in value:
            if not isinstance(color, str):
                raise serializers.ValidationError(
                    "Each dress code color must be a Hex color string."
                )

            if not HEX_COLOR_PATTERN.fullmatch(color):
                raise serializers.ValidationError(
                    f"Invalid Hex color: {color}. "
                    "Use the format #RRGGBB."
                )

        return value

    def validate(self, attrs):
        event_date = attrs.get("event_date")
        rsvp_deadline = attrs.get("rsvp_deadline")

        if event_date and rsvp_deadline:
            if rsvp_deadline > event_date:
                raise serializers.ValidationError({
                    "rsvp_deadline": (
                        "RSVP deadline cannot be after the event date."
                    )
                })

        return attrs


class GuestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Guest
        fields = [
            "id",
            "event",
            "full_name",
            "phone",
            "email",
            "category",
            "invitation_status",
            "rsvp_status",
            "rsvp_date",
            "contribution_status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "created_at",
            "updated_at",
        ]


class CardTemplateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CardTemplate
        fields = [
            "id",
            "event",
            "name",
            "category",
            "style",
            "primary_color",
            "accent_color",
            "background_color",
            "text_color",
            "font_family",
            "layout",
            "image_data_url",
            "is_premium",
            "is_custom",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "is_premium",
            "is_custom",
            "created_at",
            "updated_at",
        ]

    def validate_image_data_url(self, value):
        if not value:
            return value

        allowed_prefixes = (
            "data:image/png;base64,",
            "data:image/jpeg;base64,",
            "data:image/webp;base64,",
        )

        if not value.startswith(allowed_prefixes):
            raise serializers.ValidationError(
                "Upload a PNG, JPG, or WEBP image."
            )

        if len(value) > 2_800_000:
            raise serializers.ValidationError(
                "Template image must be 2 MB or smaller."
            )

        return value


class InvitationSerializer(serializers.ModelSerializer):
    guest_id = serializers.PrimaryKeyRelatedField(
        source="guest",
        queryset=Guest.objects.all(),
    )

    class Meta:
        model = Invitation
        fields = [
            "id",
            "event",
            "guest_id",
            "guest_name",
            "guest_phone",
            "invitation_code",
            "qr_data",
            "template_id",
            "channel",
            "package",
            "status",
            "rsvp_status",
            "customized_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "created_at",
            "updated_at",
        ]


class ContributionSerializer(serializers.ModelSerializer):
    guest_id = serializers.PrimaryKeyRelatedField(
        source="guest",
        queryset=Guest.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Contribution
        fields = [
            "id",
            "event",
            "guest_id",
            "guest_name",
            "amount",
            "contribution_type",
            "card_type",
            "status",
            "reference",
            "received_date",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "event", "created_at", "updated_at"]


class UsherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usher
        fields = [
            "id",
            "event",
            "usher_name",
            "usher_email",
            "usher_phone",
            "checkpoints",
            "access_code",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "access_code",
            "created_at",
            "updated_at",
        ]


class CheckInSerializer(serializers.ModelSerializer):
    invitation_id = serializers.PrimaryKeyRelatedField(
        source="invitation",
        queryset=Invitation.objects.all(),
    )
    guest_id = serializers.PrimaryKeyRelatedField(
        source="guest",
        queryset=Guest.objects.all(),
        required=False,
    )
    usher_id = serializers.PrimaryKeyRelatedField(
        source="usher",
        queryset=Usher.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "event",
            "invitation_id",
            "guest_id",
            "usher_id",
            "guest_name",
            "usher_name",
            "checkpoint",
            "status",
            "timestamp",
            "device_id",
            "synced_at",
        ]
        read_only_fields = [
            "id",
            "event",
            "guest_name",
            "usher_name",
            "timestamp",
        ]


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = [
            "id",
            "invitation",
            "event",
            "guest",
            "channel",
            "status",
            "recipient",
            "message",
            "created_at",
        ]
        read_only_fields = ["id", "event", "created_at"]


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "event",
            "direction",
            "amount",
            "provider",
            "gateway_reference",
            "status",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "action",
            "entity_type",
            "entity_id",
            "details",
            "severity",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "ip_address",
            "user_agent",
            "created_at",
        ]
