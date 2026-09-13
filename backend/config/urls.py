from django.contrib import admin
from django.urls import path

from accounts_app.views import (
    RegisterView,
    LoginView,
    MeView,
    LogoutView,
)

from rest_framework_simplejwt.views import TokenRefreshView

from events_app.views import (
    AuditLogListCreateView,
    CardTemplateGlobalListCreateView,
    CardTemplateListCreateView,
    CheckInListCreateView,
    ContributionListCreateView,
    EventListCreateView,
    EventDetailView,
    GuestDetailView,
    GuestListCreateView,
    InvitationDispatchView,
    InvitationListCreateView,
    NotificationLogListView,
    UsherListCreateView,
    WalletTransactionListCreateView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication
    path(
        "api/auth/register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "api/auth/login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "api/auth/me/",
        MeView.as_view(),
        name="me",
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/auth/logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    # Events
    path(
        "api/templates/",
        CardTemplateGlobalListCreateView.as_view(),
        name="template-list-create",
    ),

    path(
        "api/events/",
        EventListCreateView.as_view(),
        name="event-list-create",
    ),

    path(
        "api/events/<int:pk>/",
        EventDetailView.as_view(),
        name="event-detail",
    ),

    path(
        "api/events/<int:event_pk>/guests/",
        GuestListCreateView.as_view(),
        name="event-guest-list-create",
    ),

    path(
        "api/events/<int:event_pk>/guests/<int:pk>/",
        GuestDetailView.as_view(),
        name="event-guest-detail",
    ),

    path(
        "api/events/<int:event_pk>/templates/",
        CardTemplateListCreateView.as_view(),
        name="event-template-list-create",
    ),

    path(
        "api/events/<int:event_pk>/invitations/",
        InvitationListCreateView.as_view(),
        name="event-invitation-list-create",
    ),

    path(
        "api/events/<int:event_pk>/invitations/dispatch/",
        InvitationDispatchView.as_view(),
        name="event-invitation-dispatch",
    ),

    path(
        "api/events/<int:event_pk>/contributions/",
        ContributionListCreateView.as_view(),
        name="event-contribution-list-create",
    ),

    path(
        "api/events/<int:event_pk>/ushers/",
        UsherListCreateView.as_view(),
        name="event-usher-list-create",
    ),

    path(
        "api/events/<int:event_pk>/checkins/",
        CheckInListCreateView.as_view(),
        name="event-checkin-list-create",
    ),

    path(
        "api/events/<int:event_pk>/notifications/",
        NotificationLogListView.as_view(),
        name="event-notification-list",
    ),

    path(
        "api/wallet/transactions/",
        WalletTransactionListCreateView.as_view(),
        name="wallet-transaction-list",
    ),

    path(
        "api/audit-logs/",
        AuditLogListCreateView.as_view(),
        name="audit-log-list-create",
    ),
]
