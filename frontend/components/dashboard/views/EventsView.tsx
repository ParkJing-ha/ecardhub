import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/lib/data";
import type { Event, View } from "../types";
import { Icon, icons } from "../icons";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";
import { categoryEmoji, categoryGradient } from "../category";

export function EventsView({
  events,
  setView,
  onDeleted,
}: {
  events: Event[];
  setView: (v: View) => void;
  onDeleted: (eventId: string) => void;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [filter, setFilter] = useState<
    "All" | "Active" | "Draft" | "Completed"
  >("All");
  const filtered =
    filter === "All" ? events : events.filter((e) => e.status === filter);

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;

    await deleteEvent(event.id);
    onDeleted(event.id);
  };

  return (
    <div>
      <SectionHeader
        title="My Events"
        action={
          <button
            className="btn-gold"
            style={{ padding: "10px 20px", borderRadius: 8, fontSize: 14 }}
            onClick={() => setView("create-event")}
          >
            + New Event
          </button>
        }
      />

      {/* Filter tabs - HAKUNA MABADILIKO */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["All", "Active", "Draft", "Completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 18px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid",
              borderColor: filter === f ? "#c9a84c" : "rgba(201,168,76,0.2)",
              background:
                filter === f ? "rgba(201,168,76,0.12)" : "transparent",
              color:
                filter === f ? "var(--accent-text)" : "var(--muted-foreground)",
              transition: "all 0.15s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((ev) => (
          <div
            key={ev.id}
            className="card-base"
            style={{
              overflow: "hidden",
              transition: "transform 0.15s, box-shadow 0.15s",
              cursor: "pointer", // ← Onyesha kwamba inabonyezwa
            }}
            onClick={() => handleEventClick(ev.id)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-3px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 12px 40px rgba(201,168,76,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
            }}
          >
            {/* Header banner - HAKUNA MABADILIKO */}
            <div
              style={{
                height: 80,
                background: categoryGradient(ev.category),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 20px",
              }}
            >
              <span style={{ fontSize: 36 }}>{categoryEmoji(ev.category)}</span>
              <Badge status={ev.status} />
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontFamily: "DM Serif Display, serif",
                  fontSize: 18,
                  color: "var(--foreground)",
                  marginBottom: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {ev.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>
                {ev.category} · {ev.date}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 16 }}>
                📍 {ev.venue}
              </div>

              {/* Stats - HAKUNA MABADILIKO */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  { label: "Guests", value: ev.guestCount },
                  { label: "Sent", value: ev.sentCount },
                  { label: "RSVPs", value: ev.rsvpCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      textAlign: "center",
                      padding: "8px 4px",
                      background: "var(--secondary)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: "var(--accent-text)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons - Zimeongezwa stopPropagation na button ya Manage */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 8,
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <button
                  className="btn-gold"
                  style={{
                    padding: "9px",
                    borderRadius: 8,
                    fontSize: 12,
                    minWidth: 0,
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  setView("guests");
                }}
              >
                  Guests
                </button>
                <button
                  className="btn-outline"
                  style={{
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    minWidth: 0,
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setView("send");
                  }}
                >
                  Send Invites
                </button>
                <button
                  className="btn-outline"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    minWidth: 0,
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/card-builder/${ev.id}`);
                  }}
                >
                  Cards
                </button>
                {/* ← Button mpya ya "Manage" */}
                <button
                  className="btn-outline"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    minWidth: 0,
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/events/${ev.id}`);
                  }}
                >
                  Manage
                </button>
                <button
                  className="btn-outline"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    minWidth: 0,
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                    color: "var(--destructive)",
                    gridColumn: isMobile ? "auto" : "span 2",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(ev);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create new event card - HAKUNA MABADILIKO */}
        <div
          className="card-base"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 260,
            cursor: "pointer",
            border: "1px dashed rgba(201,168,76,0.3)",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onClick={() => setView("create-event")}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background =
              "rgba(201,168,76,0.04)";
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "rgba(201,168,76,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "";
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "rgba(201,168,76,0.3)";
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(201,168,76,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Icon d={icons.plus} size={22} stroke="var(--accent-text)" />
          </div>
          <div
            style={{
              fontFamily: "DM Serif Display, serif",
              fontSize: 16,
              color: "var(--accent-text)",
            }}
          >
            Create New Event
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
            Wedding, Birthday, Graduation &amp; more
          </div>
        </div>
      </div>
    </div>
  );
}
