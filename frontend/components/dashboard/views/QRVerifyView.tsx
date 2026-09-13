import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCheckIn,
  getCheckins,
  getGuests,
  getInvitations,
  type CheckIn,
  type Guest,
  type Invitation,
} from "@/lib/data";
import { CHECKPOINTS, formatDateTime } from "@/lib/constants";
import type { Event as DashboardEvent } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";

export function QRVerifyView({ events }: { events: DashboardEvent[] }) {
  const isMobile = useIsMobile();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [checkpoint, setCheckpoint] = useState(CHECKPOINTS[0]);
  const [scanInput, setScanInput] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: "success" | "error" | "duplicate";
    message: string;
    guestName?: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedEventId && events[0]?.id) {
      queueMicrotask(() => setSelectedEventId(events[0].id));
    }
  }, [events, selectedEventId]);

  const loadData = useCallback(async () => {
    if (!selectedEventId) {
      setGuests([]);
      setInvitations([]);
      setCheckins([]);
      return;
    }

    setLoading(true);
    try {
      const [nextGuests, nextInvitations, nextCheckins] = await Promise.all([
        getGuests(selectedEventId),
        getInvitations(selectedEventId),
        getCheckins(selectedEventId),
      ]);
      setGuests(nextGuests);
      setInvitations(nextInvitations);
      setCheckins(nextCheckins);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const checkedInAtCheckpoint = useMemo(
    () =>
      new Set(
        checkins
          .filter((checkin) => checkin.checkpoint === checkpoint)
          .map((checkin) => checkin.guest_name),
      ),
    [checkins, checkpoint],
  );
  const checkedIn = checkedInAtCheckpoint.size;
  const arrivalRate = guests.length ? Math.round((checkedIn / guests.length) * 100) : 0;

  const verify = async () => {
    const code = scanInput.trim();

    if (!selectedEventId || !code) {
      setScanResult({
        type: "error",
        message: "Enter an invitation code or guest ID.",
      });
      return;
    }

    const invitation = invitations.find((item) => {
      return (
        item.invitation_code.toLowerCase() === code.toLowerCase() ||
        item.qr_data.toLowerCase() === code.toLowerCase() ||
        item.id === code ||
        item.guest_id === code
      );
    });

    if (!invitation) {
      setScanResult({
        type: "error",
        message: "Invitation code not found for this event.",
      });
      return;
    }

    try {
      await createCheckIn(selectedEventId, {
        invitation_id: invitation.id,
        checkpoint,
        device_id: window.navigator.userAgent.slice(0, 100),
      });
      setScanResult({
        type: "success",
        message: "Guest checked in successfully.",
        guestName: invitation.guest_name,
      });
      setScanInput("");
      loadData();
    } catch (error) {
      setScanResult({
        type: "duplicate",
        message:
          error instanceof Error
            ? error.message
            : "This guest has already checked in at this checkpoint.",
        guestName: invitation.guest_name,
      });
    }
  };

  return (
    <div>
      <SectionHeader title="QR Guest Verification" />

      <div className="card-base p-4" style={{ marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
            Event
          </span>
          <select
            value={selectedEventId}
            onChange={(event) => {
              setSelectedEventId(event.target.value);
              setScanResult(null);
            }}
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--muted-foreground)",
                marginBottom: 8,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Active Checkpoint
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CHECKPOINTS.map((item) => (
                <button
                  key={item}
                  onClick={() => setCheckpoint(item)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    border: "1px solid",
                    borderColor:
                      checkpoint === item ? "#c9a84c" : "rgba(201,168,76,0.2)",
                    background:
                      checkpoint === item ? "rgba(201,168,76,0.12)" : "transparent",
                    color:
                      checkpoint === item
                        ? "var(--accent-text)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="card-base p-5" style={{ marginBottom: 20 }}>
            <div
              style={{
                height: 220,
                background: "#0d0b1e",
                borderRadius: 10,
                border: "1.5px dashed rgba(201,168,76,0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon d={icons.qr} size={46} stroke="rgba(201,168,76,0.45)" />
              <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 12 }}>
                Scan or type the invitation QR code
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                Checkpoint: <span style={{ color: "var(--accent-text)" }}>{checkpoint}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="Invitation code / QR data / guest ID"
                value={scanInput}
                onChange={(event) => setScanInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && verify()}
              />
              <button
                className="btn-gold"
                style={{ padding: "10px 20px", borderRadius: 8, whiteSpace: "nowrap" }}
                onClick={verify}
              >
                Verify
              </button>
            </div>
          </div>

          {scanResult && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 10,
                border: "1px solid",
                background:
                  scanResult.type === "success"
                    ? "rgba(34,197,94,0.1)"
                    : scanResult.type === "duplicate"
                      ? "rgba(245,158,11,0.1)"
                      : "rgba(239,68,68,0.1)",
                borderColor:
                  scanResult.type === "success"
                    ? "#22c55e44"
                    : scanResult.type === "duplicate"
                      ? "#f59e0b44"
                      : "#ef444444",
              }}
            >
              <div
                style={{
                  color:
                    scanResult.type === "success"
                      ? "#22c55e"
                      : scanResult.type === "duplicate"
                        ? "var(--amber-text)"
                        : "#ef4444",
                  fontWeight: 700,
                }}
              >
                {scanResult.type === "success"
                  ? "Checked In"
                  : scanResult.type === "duplicate"
                    ? "Already Checked In"
                    : "Invalid Code"}
              </div>
              <div style={{ color: "var(--foreground)", marginTop: 4 }}>
                {scanResult.guestName && `${scanResult.guestName} - `}
                {scanResult.message}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card-base p-5">
            <h3
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: 17,
                margin: "0 0 14px",
                color: "var(--foreground)",
              }}
            >
              Check-in Status
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ textAlign: "center", padding: 12, background: "rgba(34,197,94,0.08)", borderRadius: 8 }}>
                <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, color: "#22c55e" }}>
                  {loading ? "..." : checkedIn}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Checked In</div>
              </div>
              <div style={{ textAlign: "center", padding: 12, background: "rgba(245,158,11,0.08)", borderRadius: 8 }}>
                <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, color: "var(--amber-text)" }}>
                  {Math.max(guests.length - checkedIn, 0)}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Pending</div>
              </div>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${arrivalRate}%`, background: "linear-gradient(90deg,#22c55e,#c9a84c)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6, textAlign: "center" }}>
              {arrivalRate}% arrival rate at {checkpoint}
            </div>
          </div>

          <div className="card-base p-5">
            <h3
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: 17,
                margin: "0 0 14px",
                color: "var(--foreground)",
              }}
            >
              Recent Check-ins
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {checkins.length === 0 && (
                <div style={{ color: "var(--muted-foreground)", fontSize: 13, textAlign: "center", padding: "18px 0" }}>
                  No check-ins yet
                </div>
              )}
              {checkins.slice(0, 10).map((checkin) => (
                <div
                  key={checkin.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    background: "var(--secondary)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                      {checkin.guest_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>
                      <Badge status={checkin.checkpoint} /> {formatDateTime(checkin.timestamp)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#22c55e" }}>
                    {checkin.status.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
