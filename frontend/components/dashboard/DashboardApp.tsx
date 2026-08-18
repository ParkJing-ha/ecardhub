"use client";

import { useCallback, useState } from "react";
import type { PublicUser } from "../../lib/auth-db";
import { BottomNav, Header, Sidebar } from "./DashboardShell";
import { seedEvents, seedGuests } from "./data";
import { useIsMobile } from "./hooks";
import type { Event, Guest, View } from "./types";
import { ContributionsView } from "./views/ContributionsView";
import { CreateEventView } from "./views/CreateEventView";
import { DashboardView } from "./views/DashboardView";
import { EventsView } from "./views/EventsView";
import { GuestListView } from "./views/GuestListView";
import { QRVerifyView } from "./views/QRVerifyView";
import { SendInvitesView } from "./views/SendInvitesView";
import { WalletView } from "./views/WalletView";

export default function DashboardApp({ user }: { user: PublicUser }) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<View>("dashboard");
  const [events, setEvents] = useState<Event[]>(seedEvents);
  const [guests, setGuests] = useState<Guest[]>(seedGuests);

  const addEvent = useCallback((ev: Event) => {
    setEvents((current) => [ev, ...current]);
    setTimeout(() => setView("events"), 1200);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      {!isMobile && <Sidebar active={view} setView={setView} user={user} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header view={view} user={user} />

        <main
          style={{
            flex: 1,
            padding: isMobile ? "16px 14px" : "28px 32px",
            overflowY: "auto",
            paddingBottom: isMobile ? "80px" : undefined,
            background: "var(--background)",
          }}
        >
          {view === "dashboard" && (
            <DashboardView events={events} guests={guests} setView={setView} />
          )}
          {view === "events" && <EventsView events={events} setView={setView} />}
          {view === "create-event" && <CreateEventView onCreated={addEvent} />}
          {view === "guests" && (
            <GuestListView guests={guests} setGuests={setGuests} />
          )}
          {view === "send" && <SendInvitesView guests={guests} />}
          {view === "qr-verify" && (
            <QRVerifyView guests={guests} setGuests={setGuests} />
          )}
          {view === "wallet" && <WalletView />}
          {view === "contributions" && <ContributionsView />}
        </main>
      </div>

      {isMobile && <BottomNav active={view} setView={setView} />}
    </div>
  );
}
