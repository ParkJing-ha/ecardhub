"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { translations } from "../../utils/translations";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const t = (key: string) => translations.en[key] ?? key;
  const [tab, setTab] = useState<"login" | "register">(initialMode);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const changeTab = (nextTab: "login" | "register") => {
    setTab(nextTab);
    setError("");
    router.replace(`/auth?mode=${nextTab}`, { scroll: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "register" && form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const endpoint =
      tab === "register" ? "/api/auth/register" : "/api/auth/login";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Authentication failed.");
        }
        router.push("/dashboard");
        router.refresh();
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      {/* Left: branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 px-14 py-16"
        style={{ background: "var(--primary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-base"
            style={{ background: "var(--accent)" }}
          >
            ✉
          </div>
          <span
            className="font-display text-xl tracking-wide"
            style={{ color: "var(--accent)" }}
          >
            Invitely
          </span>
        </div>

        <div>
          <div
            className="font-mono-label text-xs tracking-widest mb-4 uppercase"
            style={{ color: "rgba(196,164,90,0.7)" }}
          >
            {t("dash_subtitle")}
          </div>
          <h2
            className="font-display text-5xl leading-tight mb-6"
            style={{ color: "var(--primary-foreground)" }}
          >
            {t("auth_tagline").split(" ").slice(0, 4).join(" ")}
            <br />
            <em style={{ color: "var(--accent)" }}>
              {t("auth_tagline").split(" ").slice(4).join(" ")}
            </em>
          </h2>
          <div className="flex flex-col gap-4 mt-8">
            {[
              { emoji: "🎓", text: "Graduation · Uhitimu" },
              { emoji: "💍", text: "Wedding · Harusi" },
              { emoji: "🎂", text: "Birthday · Siku ya Kuzaliwa" },
              { emoji: "🕌", text: "Religious · Kidini" },
              { emoji: "🏢", text: "Corporate · Kampuni" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(247,244,239,0.6)" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="font-mono-label text-xs"
          style={{ color: "rgba(247,244,239,0.3)" }}
        >
          © 2026 Invitely · 99.5% Uptime Guaranteed
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ background: "var(--accent)" }}
            >
              ✉
            </div>
            <span
              className="font-display text-lg"
              style={{ color: "var(--accent)" }}
            >
              Invitely
            </span>
          </div>

          <h2
            className="font-display text-3xl mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {tab === "login" ? t("auth_login") : t("auth_register")}
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("auth_tagline")}
          </p>

          {/* Tabs */}
          <div
            className="flex gap-1 mb-6 p-1 rounded-lg"
            style={{ background: "var(--muted)" }}
          >
            {(["login", "register"] as const).map((tab_) => (
              <button
                key={tab_}
                type="button"
                onClick={() => changeTab(tab_)}
                className="flex-1 py-2 rounded text-sm font-medium"
                style={{
                  background: tab === tab_ ? "var(--card)" : "transparent",
                  color:
                    tab === tab_
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {tab_ === "login" ? t("auth_login") : t("auth_register")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "register" && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("auth_full_name")}
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  placeholder="e.g. Amina Khalid"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {t("auth_email")}
              </label>
              <input
                style={inputStyle}
                type="email"
                required
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                }}
              />
            </div>

            {tab === "register" && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("auth_phone")}
                </label>
                <input
                  style={inputStyle}
                  type="tel"
                  placeholder="+255 712 345 678"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {t("auth_password")}
              </label>
              <input
                style={inputStyle}
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                }}
              />
            </div>

            {tab === "register" && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("auth_confirm_password")}
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />
              </div>
            )}

            {error && (
              <p
                className="text-xs px-3 py-2 rounded"
                style={{
                  background: "rgba(232,149,109,0.15)",
                  color: "#E8956D",
                  border: "1px solid rgba(232,149,109,0.3)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded font-semibold text-sm mt-1"
              style={{
                background: "var(--accent)",
                color: "var(--primary)",
                fontFamily: "'Outfit', sans-serif",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? tab === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : tab === "login"
                  ? t("auth_sign_in_btn")
                  : t("auth_register_btn")}
            </button>
          </form>

          <p
            className="text-xs text-center mt-5"
            style={{ color: "var(--muted-foreground)" }}
          >
            {tab === "login" ? t("auth_no_account") : t("auth_have_account")}{" "}
            <button
              type="button"
              onClick={() => changeTab(tab === "login" ? "register" : "login")}
              className="font-medium underline"
              style={{
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab === "login" ? t("auth_register") : t("auth_login")}
            </button>
          </p>

          {/* Social proof */}
          <div
            className="mt-8 pt-6 text-center"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="font-mono-label text-xs mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              TRUSTED BY
            </div>
            <div
              className="font-display text-2xl"
              style={{ color: "var(--foreground)" }}
            >
              128,042
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              invitations sent this year
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
