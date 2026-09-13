"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicUser } from "../../utils/types";
import { useAppPreferences } from "../AppPreferencesProvider";
import { BottomNav, Header, Sidebar } from "./DashboardShell";
import { useIsMobile } from "./hooks";

import type { ApiEvent, Event, EventCategory, View } from "./types";

import { ContributionsView } from "./views/ContributionsView";
import { CreateEventView } from "./views/CreateEventView";
import { DashboardView } from "./views/DashboardView";
import { EventsView } from "./views/EventsView";
import { GuestListView } from "./views/GuestListView";
import { AccountSettingsView } from "./views/AccountSettingsView";
import { ProfileView } from "./views/ProfileView";
import { QRVerifyView } from "./views/QRVerifyView";
import { SendInvitesView } from "./views/SendInvitesView";
import { TemplatesView } from "./views/TemplatesView";
import { WalletView } from "./views/WalletView";

const eventTypeMap: Record<string, EventCategory> = {
  wedding: "Wedding",
  graduation: "Graduation",
  birthday: "Birthday",
  kitchen_party: "Kitchen Party",
  holiday: "Holiday",
  anniversary: "Anniversary",
  send_off: "Send-off",
  custom_ceremony: "Custom Ceremony",
};

const VALID_VIEWS: View[] = [
  "dashboard",
  "events",
  "create-event",
  "templates",
  "guests",
  "send",
  "qr-verify",
  "wallet",
  "contributions",
  "profile",
  "settings",
];

function convertApiEvent(event: ApiEvent): Event {
  return {
    id: String(event.id),

    title: event.title,

    category: eventTypeMap[event.event_type] ?? "Custom Ceremony",

    date: event.event_date,

    venue: event.venue,

    status:
      event.status === "draft"
        ? "Draft"
        : event.status === "active"
          ? "Active"
          : "Completed",

    guestCount: 0,

    sentCount: 0,

    rsvpCount: 0,
  };
}

export default function DashboardApp({ user }: { user: PublicUser }) {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const { language, resolvedTheme, setLanguage, setTheme, t } = useAppPreferences();

  const requestedView = searchParams.get("view");
  const initialView: View = VALID_VIEWS.includes(requestedView as View)
    ? (requestedView as View)
    : "dashboard";

  const [view, setView] = useState<View>(initialView);

  const [events, setEvents] = useState<Event[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(true);

  const [eventsError, setEventsError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setEventsError(null);

      const response = await fetch("/api/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? data.detail ?? "Failed to load events.");
      }

      const apiEvents = data as ApiEvent[];

      setEvents(apiEvents.map(convertApiEvent));
    } catch (error) {
      setEventsError(
        error instanceof Error ? error.message : "Unable to load events.",
      );
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadEvents);
  }, [loadEvents]);

  useEffect(() => {
    const navigate = (event: globalThis.Event) => {
      const nextView = (event as CustomEvent<View>).detail;
      if (VALID_VIEWS.includes(nextView)) {
        setView(nextView);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("dashboard:navigate", navigate);
    return () => window.removeEventListener("dashboard:navigate", navigate);
  }, []);

  const addEvent = useCallback((event: Event) => {
    setEvents((current) => [event, ...current]);

    setTimeout(() => {
      setView("events");
    }, 1200);
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--background)",
      }}
    >
      {!isMobile && (
        <Sidebar
          active={view}
          setView={setView}
          user={user}
          language={language}
        />
      )}

      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(15,23,42,0.58)",
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: "min(84vw, 320px)",
              minHeight: "100vh",
              background: "var(--card)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar
              active={view}
              setView={setView}
              user={user}
              language={language}
              showAccount={false}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header
          view={view}
          user={user}
          language={language}
          theme={resolvedTheme}
          onLanguageChange={setLanguage}
          onThemeChange={setTheme}
          onOpenMenu={isMobile ? () => setMobileMenuOpen(true) : undefined}
        />

        <main
          style={{
            flex: 1,
            padding: isMobile ? "16px 14px" : "28px 32px",

            overflowY: "auto",

            paddingBottom: isMobile ? "80px" : undefined,

            background: "var(--background)",
          }}
        >
          {loadingEvents && (
            <div
              style={{
                padding: "20px",
                color: "var(--accent-text)",
              }}
            >
              {t(language, "dashboard", "loadingEvents")}
            </div>
          )}

          {eventsError && (
            <div
              style={{
                padding: "20px",
                color: "#ff6b6b",
              }}
            >
              {eventsError}
            </div>
          )}

          {!loadingEvents && !eventsError && view === "dashboard" && (
            <DashboardView events={events} setView={setView} />
          )}

          {!loadingEvents && !eventsError && view === "events" && (
            <EventsView
              events={events}
              setView={setView}
              onDeleted={removeEvent}
            />
          )}

          {!loadingEvents && !eventsError && view === "templates" && (
            <TemplatesView />
          )}

          {view === "create-event" && <CreateEventView onCreated={addEvent} />}

          {view === "guests" && <GuestListView events={events} />}

          {view === "send" && <SendInvitesView events={events} />}

          {view === "qr-verify" && <QRVerifyView events={events} />}

          {view === "wallet" && <WalletView />}

          {view === "contributions" && <ContributionsView events={events} />}

          {view === "profile" && <ProfileView user={user} />}

          {view === "settings" && <AccountSettingsView />}
        </main>
      </div>

      {isMobile && (
        <BottomNav active={view} setView={setView} language={language} />
      )}
    </div>
  );
}
