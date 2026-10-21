import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getGuests,
  getInvitations,
  sendInvitations,
  type Guest,
  type Invitation,
} from "@/lib/data";
import { INVITATION_CHANNEL_OPTIONS } from "@/lib/constants";
import type { Event as DashboardEvent } from "../types";
import { SectionHeader } from "../ui";

type Audience = "all" | "pending" | "accepted";

export function SendInvitesView({ events, initialEventId }: { events: DashboardEvent[]; initialEventId?: string | null }) {
  const [selectedEventId, setSelectedEventId] = useState(
    () => events.find((event) => event.id === initialEventId)?.id ?? events[0]?.id ?? "",
  );
  const [channel, setChannel] = useState<string>("whatsapp");
  const [audience, setAudience] = useState<Audience>("all");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadedEventId, setLoadedEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const loadVersion = useRef(0);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedEventId((current) =>
        events.some((event) => event.id === current)
          ? current
          : events.find((event) => event.id === initialEventId)?.id ?? events[0]?.id ?? "",
      );
    });
  }, [events, initialEventId]);

  const loadData = useCallback(async () => {
    const version = ++loadVersion.current;
    setErrorMessage("");

    if (!selectedEventId) {
      setGuests([]);
      setInvitations([]);
      setLoadedEventId("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [nextGuests, nextInvitations] = await Promise.all([
        getGuests(selectedEventId),
        getInvitations(selectedEventId),
      ]);
      if (version !== loadVersion.current) return;
      setGuests(nextGuests);
      setInvitations(nextInvitations);
      setLoadedEventId(selectedEventId);
    } catch (error) {
      if (version !== loadVersion.current) return;
      setLoadedEventId("");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load invitation cards.",
      );
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    queueMicrotask(loadData);
    return () => { loadVersion.current += 1; };
  }, [loadData]);

  const selectedChannel = INVITATION_CHANNEL_OPTIONS.find((item) => item.value === channel) ?? INVITATION_CHANNEL_OPTIONS[2];
  const readyCardsByAudience = useMemo(() => {
    const cards: Record<Audience, Invitation[]> = { all: [], pending: [], accepted: [] };
    if (loadedEventId !== selectedEventId) return cards;

    const guestById = new Map(guests.map((guest) => [guest.id, guest]));
    for (const invitation of invitations) {
      if (invitation.status !== "draft" && invitation.status !== "queued") continue;
      const guest = guestById.get(invitation.guest_id);
      if (!guest) continue;

      cards.all.push(invitation);
      if (guest.rsvp_status === "pending") cards.pending.push(invitation);
      if (guest.rsvp_status === "attending") cards.accepted.push(invitation);
    }
    return cards;
  }, [guests, invitations, loadedEventId, selectedEventId]);
  const dispatchTargets = readyCardsByAudience[audience];
  const canSend = Boolean(selectedEventId) && !loading && !sending && dispatchTargets.length > 0;

  const handleSend = async () => {
    if (!canSend) return;

    setSending(true);
    setMessage("");
    setErrorMessage("");

    try {
      await sendInvitations(selectedEventId, dispatchTargets, channel);
      setMessage(
        `Dispatch request recorded for ${dispatchTargets.length} invitation ${dispatchTargets.length === 1 ? "card" : "cards"} via ${selectedChannel.label}.`,
      );
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit invitation cards for sending.",
      );
    } finally {
      setSending(false);
    }
  };

  const selectStyle = {
    height: 44,
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    padding: "0 12px",
    width: "100%",
  };

  return (
    <div>
      <SectionHeader title="Send Invitation Cards" />
      <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.6, margin: "-12px 0 24px" }}>
        Generate personalised cards in Card Builder, then choose your audience and delivery channel here.
      </p>

      <div className="card-base p-5" style={{ marginBottom: 20 }}>
        <div className="grid gap-5 md:grid-cols-2">
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600 }}>Event</span>
            <select
              value={selectedEventId}
              disabled={sending || events.length === 0}
              onChange={(event) => {
                setSelectedEventId(event.target.value);
                setMessage("");
                setErrorMessage("");
              }}
              style={selectStyle}
            >
              {events.length === 0 && <option value="">No events available</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600 }}>Delivery channel</span>
            <select value={channel} disabled={sending} onChange={(event) => setChannel(event.target.value)} style={selectStyle}>
              {INVITATION_CHANNEL_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.6, margin: "14px 0 0" }}>
          {selectedChannel.description}
        </p>
      </div>

      <div className="card-base p-5" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, color: "var(--foreground)", fontWeight: 600, margin: "0 0 14px" }}>Target audience</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { value: "all" as const, label: "All guests" },
            { value: "pending" as const, label: "Pending RSVP" },
            { value: "accepted" as const, label: "Accepted only" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={sending}
              aria-pressed={audience === option.value}
              onClick={() => setAudience(option.value)}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                fontSize: 13,
                border: "1px solid",
                borderColor: audience === option.value ? "#c9a84c" : "var(--border)",
                background: audience === option.value ? "rgba(201,168,76,0.12)" : "transparent",
                color: audience === option.value ? "var(--accent-text)" : "var(--muted-foreground)",
              }}
            >
              {option.label} ({readyCardsByAudience[option.value].length})
            </button>
          ))}
        </div>
        <p style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.6, margin: "14px 0 0" }}>
          Counts show generated cards available for sending. Previously submitted cards are excluded.
        </p>
      </div>

      <div className="card-base p-5" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "var(--muted-foreground)", fontSize: 14 }}>Cards to send</span>
          <span style={{ color: "var(--accent-text)", fontSize: 24, fontWeight: 600 }}>
            {loading ? "…" : dispatchTargets.length}
          </span>
        </div>
        {!loading && !errorMessage && dispatchTargets.length === 0 && selectedEventId && (
          <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.6, margin: "12px 0 0" }}>
            No cards are ready for this audience. {" "}
            <Link href={`/card-builder/${selectedEventId}`} style={{ color: "var(--accent-text)" }}>Generate cards</Link>
            {" "}or choose another audience.
          </p>
        )}
      </div>

      {message && <p role="status" style={{ color: "var(--accent-text)", fontSize: 13, marginBottom: 14 }}>{message}</p>}
      {errorMessage && <p role="alert" style={{ color: "var(--destructive)", fontSize: 13, marginBottom: 14 }}>{errorMessage}</p>}

      <button
        type="button"
        className="btn-gold"
        disabled={!canSend}
        style={{ padding: "13px 28px", borderRadius: 10, fontSize: 15, opacity: canSend ? 1 : 0.45 }}
        onClick={handleSend}
      >
        {sending ? "Submitting…" : loading ? "Loading cards…" : `Submit ${dispatchTargets.length} cards for sending`}
      </button>
    </div>
  );
}
