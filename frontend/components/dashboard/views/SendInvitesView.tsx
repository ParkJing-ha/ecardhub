import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateInvitations,
  getGuests,
  getInvitations,
  getTemplates,
  sendInvitations,
  type Guest,
  type Invitation,
} from "@/lib/data";
import { allTemplates } from "@/lib/templates";
import { DISPATCH_CHANNELS } from "@/lib/constants";
import type { Event as DashboardEvent } from "../types";
import { Icon } from "../icons";
import { useIsMobile } from "../hooks";
import { SectionHeader } from "../ui";
import { packages as PACKAGES } from "../data";

export function SendInvitesView({ events }: { events: DashboardEvent[] }) {
  const isMobile = useIsMobile();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [pkg, setPkg] = useState<string | null>(null);
  const [channel, setChannel] = useState(DISPATCH_CHANNELS[0]);
  const [audience, setAudience] = useState<"all" | "pending" | "accepted">("all");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedEventId && events[0]?.id) {
      queueMicrotask(() => setSelectedEventId(events[0].id));
    }
  }, [events, selectedEventId]);

  const loadData = useCallback(async () => {
    if (!selectedEventId) {
      setGuests([]);
      setInvitations([]);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const [nextGuests, nextInvitations] = await Promise.all([
        getGuests(selectedEventId),
        getInvitations(selectedEventId),
      ]);
      setGuests(nextGuests);
      setInvitations(nextInvitations);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load invitations.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const selectedPkg = PACKAGES.find((item) => item.id === pkg);
  const targetGuests = useMemo(() => {
    if (audience === "pending") {
      return guests.filter((guest) => guest.rsvp_status === "pending");
    }
    if (audience === "accepted") {
      return guests.filter((guest) => guest.rsvp_status === "attending");
    }
    return guests;
  }, [audience, guests]);
  const total = targetGuests.length * (selectedPkg?.price || 0);

  const handleSend = async () => {
    if (!selectedEventId || !selectedPkg) return;

    setSending(true);
    setMessage("");

    try {
      const templates = await getTemplates(selectedEventId);
      const defaultTemplate = allTemplates(templates)[0];
      const existingForTarget = invitations.filter((invitation) =>
        targetGuests.some((guest) => guest.id === invitation.guest_id),
      );
      const created = await generateInvitations(
        selectedEventId,
        targetGuests,
        invitations,
        {
          event_id: selectedEventId,
          template_id: defaultTemplate?.id || "preset-0",
          channel: channel.toLowerCase(),
          package: selectedPkg.id,
        },
      );
      const dispatchTargets = [...existingForTarget, ...created];

      if (dispatchTargets.length === 0) {
        setMessage("There are no guests ready for dispatch.");
        return;
      }

      await sendInvitations(selectedEventId, dispatchTargets, channel.toLowerCase());
      setMessage(
        `Queued ${dispatchTargets.length} invitations via ${channel}. Delivery status is saved in notification history.`,
      );
      loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to send invitations.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Send Invitations" />

      <div className="card-base p-4" style={{ marginBottom: 20 }}>
        <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
            Event
          </span>
          <select
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            style={{
              height: 38,
              borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.22)",
              background: "var(--card)",
              color: "var(--foreground)",
              padding: "0 10px",
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", margin: "0 0 14px" }}>
          Distribution Package
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {PACKAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPkg(item.id)}
              style={{
                padding: "18px 20px",
                borderRadius: 8,
                border: "1.5px solid",
                borderColor: pkg === item.id ? item.color : "rgba(201,168,76,0.15)",
                background: pkg === item.id ? `${item.color}12` : "#17142e",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Icon d={item.icon} size={18} stroke={item.color} />
                <span style={{ fontWeight: 600, fontSize: 14, color: pkg === item.id ? item.color : "var(--foreground)" }}>
                  {item.name}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10 }}>
                {item.desc}
              </div>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 20, color: item.color }}>
                TZS {item.price}
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "Outfit,sans-serif", fontWeight: 400 }}>
                  /card
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", margin: "0 0 14px" }}>
          Target Audience
        </h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { value: "all" as const, label: `All Guests (${guests.length})` },
            {
              value: "pending" as const,
              label: `Pending RSVP (${guests.filter((guest) => guest.rsvp_status === "pending").length})`,
            },
            {
              value: "accepted" as const,
              label: `Accepted Only (${guests.filter((guest) => guest.rsvp_status === "attending").length})`,
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAudience(option.value)}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                border: "1px solid",
                borderColor:
                  audience === option.value ? "#c9a84c" : "rgba(201,168,76,0.2)",
                background:
                  audience === option.value ? "rgba(201,168,76,0.12)" : "transparent",
                color:
                  audience === option.value
                    ? "var(--accent-text)"
                    : "var(--muted-foreground)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6, maxWidth: 260, marginBottom: 24 }}>
        <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
          Channel
        </span>
        <select
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          style={{
            height: 38,
            borderRadius: 8,
            border: "1px solid rgba(201,168,76,0.22)",
            background: "var(--card)",
            color: "var(--foreground)",
            padding: "0 10px",
          }}
        >
          {DISPATCH_CHANNELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {pkg && (
        <div className="card-base p-5" style={{ marginBottom: 24, maxWidth: 440 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "var(--muted-foreground)" }}>Cards to send</span>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
              {targetGuests.length}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "var(--muted-foreground)" }}>Price per card</span>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
              TZS {selectedPkg?.price}
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(201,168,76,0.15)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Total Cost</span>
            <span style={{ fontFamily: "DM Serif Display, serif", fontSize: 22, color: "var(--accent-text)" }}>
              TZS {total.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {message && (
        <div style={{ color: "var(--muted-foreground)", fontSize: 13, marginBottom: 14 }}>
          {message}
        </div>
      )}

      <button
        className="btn-gold"
        disabled={!pkg || loading || sending || targetGuests.length === 0}
        style={{
          padding: "13px 28px",
          borderRadius: 8,
          fontSize: 15,
          opacity: pkg && !loading && !sending && targetGuests.length > 0 ? 1 : 0.45,
        }}
        onClick={handleSend}
      >
        {sending ? "Sending..." : `Send ${targetGuests.length} Invitations`}
      </button>
    </div>
  );
}
