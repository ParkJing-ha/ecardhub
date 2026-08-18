import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card-base p-5 flex flex-col gap-1">
      <span
        style={{
          color: "#8b82a0",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 32,
          lineHeight: 1,
          color: accent || "#c9a84c",
        }}
      >
        {value}
      </span>
      {sub && <span style={{ color: "#8b82a0", fontSize: 12 }}>{sub}</span>}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    Draft: { bg: "rgba(139,130,160,0.15)", color: "#8b82a0" },
    Completed: { bg: "rgba(201,168,76,0.15)", color: "#c9a84c" },
    Accepted: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    Declined: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    Pending: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    Delivered: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
    Sent: { bg: "rgba(139,130,160,0.15)", color: "#a0aec0" },
    "Not Sent": { bg: "rgba(239,68,68,0.1)", color: "#fc8181" },
    Failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    VIP: { bg: "rgba(201,168,76,0.15)", color: "#c9a84c" },
    Couple: { bg: "rgba(124,92,191,0.15)", color: "#7c5cbf" },
    Single: { bg: "rgba(26,128,102,0.2)", color: "#1a8066" },
  };
  const s = map[status] || {
    bg: "rgba(255,255,255,0.08)",
    color: "#f0ece8",
  };
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontFamily: "DM Serif Display, serif",
          fontSize: 26,
          margin: 0,
          color: "#f0ece8",
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
