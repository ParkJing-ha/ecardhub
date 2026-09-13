"use client";

export type PasswordRule = {
  id: string;
  label: string;
  met: boolean;
};

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: "At least 12 characters long",
      met: password.length >= 12,
    },
    {
      id: "uppercase",
      label: "Contains at least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Contains at least one lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Contains at least one number (0-9)",
      met: /\d/.test(password),
    },
    {
      id: "special",
      label: "Contains at least one special character (@, #, $, !, %, *, ?, &)",
      met: /[^\w\s]/.test(password),
    },
  ];
}

export function isStrongPassword(password: string) {
  return getPasswordRules(password).every((rule) => rule.met);
}

export function PasswordStrength({
  password,
}: {
  password: string;
}) {
  const rules = getPasswordRules(password);
  const metCount = rules.filter((rule) => rule.met).length;
  const strength =
    metCount <= 2 ? "Weak" : metCount <= 4 ? "Medium" : "Strong";
  const fill = `${(metCount / rules.length) * 100}%`;
  const strengthColor =
    strength === "Strong"
      ? "#22c55e"
      : strength === "Medium"
        ? "var(--amber-text)"
        : "var(--destructive)";

  return (
    <div
      style={{
        marginTop: 10,
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "var(--secondary)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
          fontSize: 12,
          color: "var(--muted-foreground)",
        }}
      >
        <span>Password strength</span>
        <strong style={{ color: strengthColor }}>{strength}</strong>
      </div>
      <div
        aria-hidden="true"
        style={{
          height: 7,
          borderRadius: 999,
          background: "var(--muted)",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: fill,
            height: "100%",
            borderRadius: 999,
            background: strengthColor,
            transition: "width 160ms ease, background-color 160ms ease",
          }}
        />
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: 7,
        }}
      >
        {rules.map((rule) => (
          <li
            key={rule.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              color: rule.met ? "#16a34a" : "var(--muted-foreground)",
              fontSize: 12,
              lineHeight: 1.35,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                flexShrink: 0,
                fontWeight: 800,
              }}
            >
              {rule.met ? "✓" : "○"}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
