import Link from "next/link";

export default function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="font-mono-label text-xs"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          Back to Invitely
        </Link>
        <div style={{ marginTop: 72 }}>
          <div
            className="font-mono-label text-xs uppercase"
            style={{ color: "rgba(229,193,88,0.8)", letterSpacing: "0.12em" }}
          >
            {eyebrow}
          </div>
          <h1
            className="font-display"
            style={{ color: "#fff", fontSize: "clamp(2.5rem, 8vw, 5rem)", margin: "14px 0 22px" }}
          >
            {title}
          </h1>
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
