import type { PublicUser } from "@/utils/types";
import { SectionHeader } from "../ui";

export function ProfileView({ user }: { user: PublicUser }) {
  return (
    <div style={{ maxWidth: 860 }}>
      <SectionHeader title="My Profile" />
      <div
        className="card-base"
        style={{
          padding: 20,
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #7c5cbf)",
              color: "var(--accent-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {(user.full_name || user.email || "U")
              .split(/\s|@/)
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                color: "var(--foreground)",
                fontSize: 20,
                overflowWrap: "anywhere",
              }}
            >
              {user.full_name || "User"}
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                color: "var(--muted-foreground)",
                overflowWrap: "anywhere",
              }}
            >
              {user.email}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <ProfileField label="Full Name" value={user.full_name || "-"} />
          <ProfileField label="Email" value={user.email || "-"} />
          <ProfileField label="Phone" value={user.phone_number || "-"} />
          <ProfileField label="Role" value={user.role.replace("_", " ")} />
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 14,
        background: "var(--secondary)",
      }}
    >
      <div
        style={{
          color: "var(--muted-foreground)",
          fontSize: 11,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "var(--foreground)",
          marginTop: 6,
          fontWeight: 600,
          overflowWrap: "anywhere",
          textTransform: label === "Role" ? "capitalize" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
