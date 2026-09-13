"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAppPreferences } from "../AppPreferencesProvider";
import { isStrongPassword, PasswordStrength } from "./PasswordStrength";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const nextPath = searchParams.get("next") || "/dashboard";
  const { language, resolvedTheme, setLanguage, setTheme, t } =
    useAppPreferences();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordReady = tab === "login" || isStrongPassword(form.password);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const getErrorMessage = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return t(language, "errors", "authFailed");
    }

    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }

    if ("detail" in data && typeof data.detail === "string") {
      return data.detail;
    }

    const fieldMessages = Object.entries(data)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) {
          return value.map((message) => `${field}: ${String(message)}`);
        }

        if (typeof value === "string") {
          return [`${field}: ${value}`];
        }

        return [];
      })
      .join(" ");

    return fieldMessages || t(language, "errors", "authFailed");
  };

  const changeTab = (nextTab: "login" | "register") => {
    setTab(nextTab);
    setError("");
    router.replace(`/auth?mode=${nextTab}`, { scroll: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "register" && form.password !== form.confirm) {
      setError(t(language, "errors", "passwordsMismatch"));
      return;
    }
    if (tab === "register" && !isStrongPassword(form.password)) {
      setError("Password must meet all requirements before registration.");
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
          throw new Error(getErrorMessage(data));
        }
        router.push(nextPath);
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
        style={{ background: "var(--brand-surface)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-3"
          style={{ textDecoration: "none" }}
          aria-label="Go to EcardHub home page"
        >
          <BrandLogo size={34} />
          <span
            className="font-display text-xl tracking-wide"
            style={{ color: "var(--accent-text)" }}
          >
            {t(language, "common", "appName")}
          </span>
        </Link>

        <div>
          <div
            className="font-mono-label text-xs tracking-widest mb-4 uppercase"
            style={{ color: "rgba(196,164,90,0.7)" }}
          >
            {t(language, "landing", "eyebrow")}
          </div>
          <h2
            className="font-display text-5xl leading-tight mb-6"
            style={{ color: "var(--brand-surface-foreground)" }}
          >
            {t(language, "auth", "tagline").split(" ").slice(0, 4).join(" ")}
            <br />
            <em style={{ color: "var(--accent-text)" }}>
              {t(language, "auth", "tagline").split(" ").slice(4).join(" ")}
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
          © 2026 {t(language, "common", "appName")} · 99.5% Uptime Guaranteed
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-8 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 lg:hidden"
            style={{ textDecoration: "none" }}
            aria-label="Go to EcardHub home page"
          >
            <BrandLogo size={30} />
            <span
              className="font-display text-lg"
              style={{ color: "var(--accent-text)" }}
            >
              {t(language, "common", "appName")}
            </span>
          </Link>

          <div
            className="flex items-center justify-between gap-3 mb-5"
            aria-label="Preferences"
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 3,
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              {(["en", "sw"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  style={{
                    minWidth: 38,
                    minHeight: 34,
                    border: 0,
                    borderRadius: 6,
                    background: language === item ? "var(--accent)" : "transparent",
                    color:
                      language === item
                        ? "var(--accent-foreground)"
                        : "var(--muted-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--foreground)",
              }}
            >
              {resolvedTheme === "dark" ? "☀" : "☾"}
            </button>
          </div>

          <h2
            className="font-display text-3xl mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {tab === "login" ? t(language, "auth", "login") : t(language, "auth", "register")}
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t(language, "auth", "tagline")}
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
                {tab_ === "login" ? t(language, "auth", "login") : t(language, "auth", "register")}
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
                  {t(language, "auth", "fullName")}
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
                {t(language, "auth", "email")}
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
                  {t(language, "auth", "phone")}
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
                {t(language, "auth", "password")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: 48 }}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={tab === "register" ? 12 : undefined}
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
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 4,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    border: 0,
                    background: "transparent",
                    color: "var(--muted-foreground)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {tab === "register" && <PasswordStrength password={form.password} />}
            </div>

            {tab === "register" && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t(language, "auth", "confirmPassword")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 48 }}
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={12}
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
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    style={{
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 44,
                      height: 44,
                      border: 0,
                      background: "transparent",
                      color: "var(--muted-foreground)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {tab === "login" && (
              <Link
                href="/reset-password"
                className="self-end text-xs font-semibold"
                style={{ color: "var(--accent-text)", textDecoration: "none" }}
              >
                Forgot password?
              </Link>
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
              disabled={loading || !passwordReady}
              className="w-full py-3 rounded font-semibold text-sm mt-1"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
                fontFamily: "'Outfit', sans-serif",
                opacity: loading || !passwordReady ? 0.55 : 1,
                cursor: loading || !passwordReady ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? tab === "login"
                  ? t(language, "auth", "signingIn")
                  : t(language, "auth", "creatingAccount")
                : tab === "login"
                  ? t(language, "auth", "login")
                  : t(language, "auth", "register")}
            </button>
          </form>

          <p
            className="text-xs text-center mt-5"
            style={{ color: "var(--muted-foreground)" }}
          >
            {tab === "login" ? t(language, "auth", "noAccount") : t(language, "auth", "haveAccount")}{" "}
            <button
              type="button"
              onClick={() => changeTab(tab === "login" ? "register" : "login")}
              className="font-medium underline"
              style={{
                color: "var(--accent-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab === "login" ? t(language, "auth", "register") : t(language, "auth", "login")}
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
              {t(language, "auth", "trustedBy").toUpperCase()}
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
              {t(language, "auth", "invitationsSent")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
