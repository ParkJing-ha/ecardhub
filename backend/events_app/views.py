from django.db import IntegrityError, transaction
from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

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
from .serializers import (
    AuditLogSerializer,
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
        if isinstance(request.data, list):
            event = self.get_event()
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return super().create(request, *args, **kwargs)


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
        return Invitation.objects.filter(event=self.get_event())

    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        event = self.get_event()
        serializer.fields["guest_id"].queryset = Guest.objects.filter(
            event=event,
        )
        return serializer

    def perform_create(self, serializer):
        serializer.save(event=self.get_event())

    def create(self, request, *args, **kwargs):
        event = self.get_event()
        records = request.data if isinstance(request.data, list) else [request.data]
        created = []

        for record in records:
            guest_id = record.get("guest_id")
            if Invitation.objects.filter(event=event, guest_id=guest_id).exists():
                continue

            serializer = self.get_serializer(data=record)
            serializer.is_valid(raise_exception=True)
            created.append(serializer.save(event=event))

        output = self.get_serializer(created, many=True)
        return Response(output.data, status=status.HTTP_201_CREATED)


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
        serializer.fields["guest_id"].queryset = Guest.objects.filter(event=event)
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
        serializer.fields["invitation_id"].queryset = Invitation.objects.filter(
            event=event,
        )
        serializer.fields["guest_id"].queryset = Guest.objects.filter(event=event)
        serializer.fields["usher_id"].queryset = Usher.objects.filter(event=event)
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
