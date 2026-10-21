from django.db import IntegrityError, transaction
from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .card_generation import bulk_create_invitations, new_card_code
from .limits import MAX_EVENT_CARDS, MAX_EVENT_GUESTS

from .models import (
    AuditLog,
    CardGenerationSnapshot,
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
from .serializers import (
    AuditLogSerializer,
    CardGenerationSerializer,
    CardTemplateSerializer,
    CheckInSerializer,
    ContributionSerializer,
    EventSerializer,
    GuestSerializer,
    InvitationSerializer,
    NotificationLogSerializer,
    UsherSerializer,
    WalletTransactionSerializer,
)


def event_capacity_response(kind, current_count, requested_count):
    limit = MAX_EVENT_GUESTS if kind == "guest" else MAX_EVENT_CARDS
    remaining_count = max(limit - current_count, 0)
    return Response({
        "detail": (f"An event can have at most {limit} {kind}s. "
                   f"This event has {current_count}; {remaining_count} slots remain."),
        "code": f"event_{kind}_limit_exceeded",
        "limit": limit,
        "current_count": current_count,
        "requested_count": requested_count,
        "remaining_count": remaining_count,
    }, status=status.HTTP_409_CONFLICT)


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(
            owner=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user
        )


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(
            owner=self.request.user
        )


class EventOwnedMixin:
    event_kwarg = "event_pk"

    def get_event(self):
        return generics.get_object_or_404(
            Event,
            pk=self.kwargs[self.event_kwarg],
            owner=self.request.user,
        )


class GuestListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Guest.objects.filter(event=self.get_event())

    def perform_create(self, serializer):
        serializer.save(event=self.get_event())

    def create(self, request, *args, **kwargs):
        is_bulk = isinstance(request.data, list)
        if is_bulk and not request.data:
            self.get_event()
            return Response({"detail": "Select at least one guest to import.",
                             "code": "empty_guest_list"}, status=status.HTTP_400_BAD_REQUEST)
        requested_count = len(request.data) if is_bulk else 1
        with transaction.atomic():
            # Single additions and complete imports share this lock, so two
            # concurrent requests cannot both consume the last available slots.
            event = generics.get_object_or_404(
                Event.objects.select_for_update(),
                pk=self.kwargs["event_pk"], owner=request.user,
            )
            current_count = Guest.objects.filter(event=event).count()
            if current_count + requested_count > MAX_EVENT_GUESTS:
                return event_capacity_response("guest", current_count, requested_count)
            serializer = self.get_serializer(data=request.data, many=is_bulk)
            if not serializer.is_valid():
                if not is_bulk:
                    raise ValidationError(serializer.errors)
                errors = serializer.errors
                # DRF 3.18 keys ListSerializer errors by record index; older
                # versions return an aligned list. Preserve row numbers in both.
                indexed_errors = errors.items() if isinstance(errors, dict) else enumerate(errors)
                row_errors = [{"row": int(index) + 1, "fields": fields}
                              for index, fields in indexed_errors if fields and str(index).isdigit()]
                return Response({
                    "detail": "Some guest rows are invalid. Nothing was imported.",
                    "code": "invalid_guest_rows",
                    "errors": row_errors or [{"row": None, "fields": errors}],
                }, status=status.HTTP_400_BAD_REQUEST)
            rows = serializer.validated_data if is_bulk else [serializer.validated_data]
            existing = set(Guest.objects.filter(
                event=event, full_name__in=[row["full_name"] for row in rows],
            ).values_list("full_name", "phone"))
            seen = {}
            duplicates = []
            for index, row in enumerate(rows):
                key = (row["full_name"], row.get("phone", ""))
                if key in existing or key in seen:
                    message = ("This guest already exists in this event." if key in existing else
                               f"This guest duplicates record {seen[key]} (same name and phone).")
                    duplicates.append({"row": index + 1,
                                       "fields": {"non_field_errors": [message]}})
                seen.setdefault(key, index + 1)
            if duplicates:
                return Response({
                    "detail": "Some guest rows are duplicates. Nothing was imported.",
                    "code": "invalid_guest_rows" if is_bulk else "duplicate_guest",
                    "errors": duplicates,
                }, status=status.HTTP_400_BAD_REQUEST if is_bulk else status.HTTP_409_CONFLICT)
            try:
                with transaction.atomic():
                    if is_bulk:
                        serializer.instance = Guest.objects.bulk_create([
                            Guest(event=event, **row) for row in rows
                        ])
                    else:
                        serializer.save(event=event)
            except IntegrityError:
                return Response({
                    "detail": "A guest with the same name and phone already exists. Nothing was imported.",
                    "code": "duplicate_guest",
                }, status=status.HTTP_409_CONFLICT)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class GuestDetailView(EventOwnedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Guest.objects.filter(event=self.get_event())


class CardTemplateGlobalListCreateView(generics.ListCreateAPIView):
    serializer_class = CardTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CardTemplate.objects.filter(
            owner=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user,
            event=None,
            is_custom=True,
        )


class CardTemplateListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = CardTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event = self.get_event()
        return CardTemplate.objects.filter(
            Q(event=event) | Q(event__isnull=True),
            owner=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user,
            event=self.get_event(),
            is_custom=True,
        )


class InvitationListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invitation.objects.filter(event=self.get_event()).prefetch_related("card_generation")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["include_card_artifact"] = self.request.method != "GET"
        return context

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        event = self.get_event()
        fields = serializer.child.fields if hasattr(serializer, "child") else serializer.fields
        fields["guest_id"].queryset = Guest.objects.filter(
            event=event,
        )
        return serializer

    def perform_create(self, serializer):
        serializer.save(event=self.get_event())

    def create(self, request, *args, **kwargs):
        records = request.data if isinstance(request.data, list) else [request.data]
        with transaction.atomic():
            event = generics.get_object_or_404(
                Event.objects.select_for_update(),
                pk=self.kwargs["event_pk"], owner=request.user,
            )
            existing_guests = set(str(guest_id) for guest_id in
                                  Invitation.objects.filter(event=event).values_list("guest_id", flat=True))
            candidates = [record for record in records if not isinstance(record, dict)
                          or str(record.get("guest_id")) not in existing_guests]
            serializer = self.get_serializer(data=candidates, many=True)
            serializer.is_valid(raise_exception=True)
            rows = []
            seen_guests, seen_codes = set(), set()
            for row in serializer.validated_data:
                guest_id = row["guest"].pk
                if str(guest_id) in existing_guests or guest_id in seen_guests:
                    continue
                code = row["invitation_code"]
                if code in seen_codes:
                    raise ValidationError({"invitation_code": "Each card must have a unique card ID."})
                seen_guests.add(guest_id)
                seen_codes.add(code)
                rows.append(row)
            current_count = Invitation.objects.filter(event=event).count()
            if rows and current_count + len(rows) > MAX_EVENT_CARDS:
                return event_capacity_response("card", current_count, len(rows))
            try:
                with transaction.atomic():
                    created = bulk_create_invitations([
                        Invitation(event=event, **row) for row in rows
                    ])
            except IntegrityError:
                return Response({
                    "detail": "A card with this guest or card ID already exists. Nothing was created.",
                    "code": "duplicate_card",
                }, status=status.HTTP_409_CONFLICT)
            output = self.get_serializer(created, many=True)
            return Response(output.data, status=status.HTTP_201_CREATED)


class InvitationGenerateView(EventOwnedMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        self.get_event()  # Return the same 404 for missing and unowned events.
        payload = CardGenerationSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        selection = payload.validated_data
        with transaction.atomic():
            # Serialize competing requests for this event, preserving one stable
            # card ID per guest even when users repeat or retry generation.
            event = Event.objects.select_for_update().get(
                pk=self.kwargs["event_pk"], owner=request.user,
            )
            templates = CardTemplate.objects.filter(event=event, owner=request.user)
            if selection.get("template_id"):
                templates = templates.filter(pk=selection["template_id"])
            template = templates.first()
            if template is None:
                raise ValidationError({"template_id": "Save a design for this event before generating cards."})
            guests = Guest.objects.filter(event=event)
            if selection.get("all_guests"):
                guests = list(guests[:101])
                if len(guests) > 100:
                    raise ValidationError({"all_guests": "Generate at most 100 guests per request using guest_ids."})
            else:
                requested_ids = selection["guest_ids"]
                guests = list(guests.filter(pk__in=requested_ids))
                if len(guests) != len(requested_ids):
                    raise ValidationError({"guest_ids": "Every selected guest must belong to this event."})
            if not guests:
                raise ValidationError({"guest_ids": "Add and select guests before generating cards."})
            existing = {
                card.guest_id: card for card in Invitation.objects.filter(
                    event=event, guest_id__in=[guest.pk for guest in guests],
                ).prefetch_related("card_generation")
            }
            new_guests = [guest for guest in guests if guest.pk not in existing]
            current_count = Invitation.objects.filter(event=event).count()
            if new_guests and current_count + len(new_guests) > MAX_EVENT_CARDS:
                return event_capacity_response("card", current_count, len(new_guests))
            generation = None
            if new_guests:
                event_data = dict(EventSerializer(event).data)
                template_data = dict(CardTemplateSerializer(template).data)
                latest = CardGenerationSnapshot.objects.filter(
                    event=event, template=template,
                ).order_by("-pk").first()
                if latest and latest.event_data == event_data and latest.template_data == template_data:
                    generation = latest
                else:
                    generation = CardGenerationSnapshot.objects.create(
                        event=event, template=template,
                        event_data=event_data, template_data=template_data,
                    )
            pending_cards = []
            for guest in new_guests:
                code = new_card_code()
                pending_cards.append(Invitation(
                    event=event, guest=guest,
                    guest_name=guest.full_name, guest_phone=guest.phone,
                    invitation_code=code, qr_data=code,
                    template_id=str(template.pk),
                    channel="whatsapp", package="standard", status="draft",
                    rsvp_status=guest.rsvp_status, customized_text=event.card_message,
                    card_generation=generation,
                    guest_snapshot={"id": guest.pk, "full_name": guest.full_name,
                                    "phone": guest.phone, "category": guest.category},
                ))
            created = {card.guest_id: card for card in bulk_create_invitations(pending_cards)}
            cards = [existing[guest.pk] if guest.pk in existing else created[guest.pk]
                     for guest in guests]
            # Generation prepares drafts without contacting or notifying guests.
            Guest.objects.filter(pk__in=[guest.pk for guest in new_guests]).update(
                invitation_status=Guest.InvitationStatus.DRAFT,
            )
        return Response({
            "invitations": InvitationSerializer(
                cards, many=True, context={"include_card_artifact": False},
            ).data,
            "created_count": len(new_guests),
            "existing_count": len(existing),
        }, status=status.HTTP_201_CREATED if new_guests else status.HTTP_200_OK)


class InvitationDetailView(EventOwnedMixin, generics.RetrieveAPIView):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invitation.objects.filter(event=self.get_event()).select_related("card_generation")


class InvitationDispatchView(EventOwnedMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        event = self.get_event()
        invitation_ids = request.data.get("invitation_ids", [])
        channel = request.data.get("channel", "whatsapp")

        invitations = Invitation.objects.filter(
            event=event,
            id__in=invitation_ids,
        ).select_related("guest")

        with transaction.atomic():
            for invitation in invitations:
                invitation.channel = channel
                invitation.status = "sent"
                invitation.guest.invitation_status = Guest.InvitationStatus.SENT
                invitation.guest.save(update_fields=["invitation_status", "updated_at"])
                invitation.save(update_fields=["channel", "status", "updated_at"])
                NotificationLog.objects.create(
                    invitation=invitation,
                    event=event,
                    guest=invitation.guest,
                    channel=channel,
                    status="sent",
                    recipient=invitation.guest.email or invitation.guest.phone,
                    message=invitation.customized_text,
                )

        return Response(
            {
                "sent_count": invitations.count(),
                "channel": channel,
            },
            status=status.HTTP_200_OK,
        )


class ContributionListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Contribution.objects.filter(event=self.get_event())

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        event = self.get_event()
        fields = serializer.child.fields if hasattr(serializer, "child") else serializer.fields
        fields["guest_id"].queryset = Guest.objects.filter(event=event)
        return serializer

    def perform_create(self, serializer):
        serializer.save(event=self.get_event())


class UsherListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = UsherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Usher.objects.filter(event=self.get_event(), host=self.request.user)

    def perform_create(self, serializer):
        serializer.save(event=self.get_event(), host=self.request.user)


class CheckInListCreateView(EventOwnedMixin, generics.ListCreateAPIView):
    serializer_class = CheckInSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CheckIn.objects.filter(event=self.get_event())

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        event = self.get_event()
        fields = serializer.child.fields if hasattr(serializer, "child") else serializer.fields
        fields["invitation_id"].queryset = Invitation.objects.filter(
            event=event,
        )
        fields["guest_id"].queryset = Guest.objects.filter(event=event)
        fields["usher_id"].queryset = Usher.objects.filter(event=event)
        return serializer

    def perform_create(self, serializer):
        event = self.get_event()
        invitation = serializer.validated_data["invitation"]
        serializer.save(
            event=event,
            guest=invitation.guest,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {
                    "detail": (
                        "This invitation has already been checked in at this checkpoint."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationLogListView(EventOwnedMixin, generics.ListAPIView):
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationLog.objects.filter(event=self.get_event())


class WalletTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WalletTransaction.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class AuditLogListCreateView(generics.ListCreateAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AuditLog.objects.filter(actor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            actor=self.request.user,
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )
