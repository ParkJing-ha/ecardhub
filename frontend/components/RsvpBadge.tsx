const MAP: Record<string, { tone: string; label: string }> = {
  attending: { tone: "bg-emerald-500/15 text-emerald-600", label: "Attending" },
  not_attending: {
    tone: "bg-rose-500/15 text-rose-600",
    label: "Not attending",
  },
  maybe: {
    tone: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    label: "Maybe",
  },
  pending: { tone: "bg-muted text-foreground", label: "Pending" },
};

export default function RsvpBadge({ status }: { status: string }) {
  const cfg = MAP[status] || MAP.pending;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[0.65rem] font-semibold ${cfg.tone}`}
    >
      {cfg.label}
    </span>
  );
}
