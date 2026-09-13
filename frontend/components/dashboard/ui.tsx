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
          color: "var(--muted-foreground)",
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
          color: accent || "var(--accent)",
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "badge--success",
    Draft: "badge--muted",
    Completed: "badge--gold",
    Accepted: "badge--success",
    Declined: "badge--danger",
    Pending: "badge--amber",
    Delivered: "badge--info",
    Sent: "badge--info",
    "Not Sent": "badge--danger",
    Failed: "badge--danger",
    VIP: "badge--gold",
    Couple: "badge--violet",
    Single: "badge--teal",
  };
  return <span className={`badge ${map[status] || "badge--muted"}`}>{status}</span>;
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
          color: "var(--foreground)",
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
