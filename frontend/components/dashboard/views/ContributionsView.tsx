import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getContributions,
  getGuests,
  saveContribution,
  type Contribution,
  type Guest,
} from "@/lib/data";
import { formatDateTime } from "@/lib/constants";
import ContributionDialog from "@/components/ContributionDialog";
import type { Event as DashboardEvent } from "../types";
import { useIsMobile } from "../hooks";
import { SectionHeader, StatCard } from "../ui";

export function ContributionsView({ events }: { events: DashboardEvent[] }) {
  const isMobile = useIsMobile();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  useEffect(() => {
    if (!selectedEventId && events[0]?.id) {
      queueMicrotask(() => setSelectedEventId(events[0].id));
    }
  }, [events, selectedEventId]);

  const loadData = useCallback(async () => {
    if (!selectedEventId) {
      setContributions([]);
      setGuests([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [nextContributions, nextGuests] = await Promise.all([
        getContributions(selectedEventId),
        getGuests(selectedEventId),
      ]);
      setContributions(nextContributions);
      setGuests(nextGuests);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load contributions.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    queueMicrotask(loadData);
  }, [loadData]);

  const total = useMemo(
    () =>
      contributions
        .filter((contribution) => contribution.status === "received")
        .reduce((sum, contribution) => sum + contribution.amount, 0),
    [contributions],
  );
  const target = selectedEvent ? Math.max(selectedEvent.guestCount * 10000, 1) : 1;
  const progress = Math.min(Math.round((total / target) * 100), 100);

  const handleSave = async (form: {
    guest_id: string;
    amount: number;
    contribution_type: string;
    card_type: string;
    notes: string;
  }) => {
    if (!selectedEventId) return;

    const guest = guests.find((item) => item.id === form.guest_id);
    await saveContribution(selectedEventId, form, guest?.full_name || "Guest");
    setDialogOpen(false);
    loadData();
  };

  return (
    <div>
      <SectionHeader
        title="Contribution Management"
        action={
          <button
            className="btn-gold"
            disabled={!selectedEventId || guests.length === 0}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 14,
              opacity: selectedEventId && guests.length > 0 ? 1 : 0.55,
            }}
            onClick={() => setDialogOpen(true)}
          >
            Record Contribution
          </button>
        }
      />

      <div className="card-base p-4" style={{ marginBottom: 16 }}>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Total Received"
          value={`TZS ${total.toLocaleString()}`}
          sub={`${contributions.length} contributions`}
        />
        <StatCard
          label="Tracked Guests"
          value={guests.length}
          sub="for selected event"
          accent="var(--muted-foreground)"
        />
        <StatCard
          label="Progress"
          value={`${progress}%`}
          sub="against estimated target"
          accent="#22c55e"
        />
      </div>

      <div className="card-base p-5" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
            Contribution Progress
          </span>
          <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>
            TZS {total.toLocaleString()} / {target.toLocaleString()}
          </span>
        </div>
        <div
          style={{
            height: 12,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg,#c9a84c,#22c55e)",
              borderRadius: 6,
            }}
          />
        </div>
      </div>

      <div className="card-base" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(201,168,76,0.1)",
          }}
        >
          <h3
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 18,
              margin: 0,
              color: "var(--foreground)",
            }}
          >
            Individual Contributions
          </h3>
        </div>

        {error && <div style={{ padding: 16, color: "#ff6b6b" }}>{error}</div>}
        {loading ? (
          <div style={{ padding: 24, color: "var(--muted-foreground)" }}>Loading...</div>
        ) : contributions.length === 0 ? (
          <div style={{ padding: 24, color: "var(--muted-foreground)" }}>
            No contributions recorded for this event.
          </div>
        ) : isMobile ? (
          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
            }}
          >
            {contributions.map((contribution) => (
              <div
                key={contribution.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 14,
                  background: "var(--card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "var(--foreground)",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {contribution.guest_name || "-"}
                    </div>
                    <div
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {formatDateTime(contribution.received_date)}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--accent-text)",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    TZS {contribution.amount.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <span className="badge">{contribution.contribution_type}</span>
                  <span className="badge">{contribution.card_type}</span>
                </div>
                {contribution.notes && (
                  <p
                    style={{
                      color: "var(--muted-foreground)",
                      fontSize: 12,
                      margin: "12px 0 0",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {contribution.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                  {["Guest Name", "Amount", "Date", "Method", "Card", "Note"].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          padding: "12px 20px",
                          textAlign: "left",
                          color: "var(--muted-foreground)",
                          fontWeight: 600,
                          fontSize: 11,
                          textTransform: "uppercase",
                        }}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr
                    key={contribution.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "14px 20px", color: "var(--foreground)", fontWeight: 600 }}>
                      {contribution.guest_name || "-"}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--accent-text)", fontWeight: 700 }}>
                      TZS {contribution.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>
                      {formatDateTime(contribution.received_date)}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>
                      {contribution.contribution_type}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>
                      {contribution.card_type}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>
                      {contribution.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ContributionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guests={guests}
        onSave={handleSave}
      />
    </div>
  );
}
