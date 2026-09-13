"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicUser } from "../../utils/types";
import type { AppLanguage, AppTheme } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import type { View } from "./types";
import { Icon, icons } from "./icons";

export type DashboardLanguage = AppLanguage;
export type DashboardTheme = Exclude<AppTheme, "system">;

const NAV_ITEMS: {
  view: View;
  label: string;
  labelSw: string;
  icon: string;
}[] = [
  { view: "dashboard", label: "Dashboard", labelSw: "Dashibodi", icon: icons.dashboard },
  { view: "events", label: "My Events", labelSw: "Matukio Yangu", icon: icons.events },
  { view: "create-event", label: "Create Event", labelSw: "Tengeneza Tukio", icon: icons.create },
  { view: "templates", label: "Templates", labelSw: "Miundo ya Kadi", icon: icons.templates },
  { view: "guests", label: "Guest List", labelSw: "Orodha ya Wageni", icon: icons.guests },
  { view: "send", label: "Send Invites", labelSw: "Tuma Mialiko", icon: icons.send },
  { view: "qr-verify", label: "QR Verify", labelSw: "Hakiki QR", icon: icons.qr },
  { view: "wallet", label: "Wallet", labelSw: "Mkoba", icon: icons.wallet },
  { view: "contributions", label: "Contributions", labelSw: "Michango", icon: icons.contributions },
];

const BOTTOM_NAV: {
  view: View;
  label: string;
  labelSw: string;
  icon: string;
}[] = [
  { view: "dashboard", label: "Home", labelSw: "Mwanzo", icon: icons.dashboard },
  { view: "events", label: "Events", labelSw: "Matukio", icon: icons.events },
  { view: "guests", label: "Guests", labelSw: "Wageni", icon: icons.guests },
  { view: "qr-verify", label: "Scan", labelSw: "Skani", icon: icons.qr },
  { view: "wallet", label: "Wallet", labelSw: "Mkoba", icon: icons.wallet },
];

export function BottomNav({
  active,
  setView,
  language,
}: {
  active: View;
  setView: (v: View) => void;
  language: DashboardLanguage;
}) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 62,
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {BOTTOM_NAV.map((item) => {
        const isActive = active === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--accent-text)" : "var(--muted-foreground)",
              fontFamily: "Outfit, sans-serif",
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              transition: "color 0.15s",
              paddingTop: 6,
            }}
          >
            <Icon
              d={item.icon}
              size={20}
              stroke={isActive ? "var(--accent-text)" : "var(--muted-foreground)"}
            />
            {language === "sw" ? item.labelSw : item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  active,
  setView,
  user,
  language,
  showAccount = true,
  onNavigate,
}: {
  active: View;
  setView: (v: View) => void;
  user: PublicUser;
  language: DashboardLanguage;
  showAccount?: boolean;
  onNavigate?: () => void;
}) {
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
          opacity: 0.8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandLogo size={36} />
          <div>
            <div
              style={{
                fontFamily: "DM Serif Display, serif",
                fontSize: 15,
                color: "var(--foreground)",
                lineHeight: 1.1,
              }}
            >
              EcardHub
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--accent-text)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Platform
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.view;
          return (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                onNavigate?.();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: isActive
                  ? "rgba(229, 193, 88, 0.1)"
                  : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "Outfit, sans-serif",
                textAlign: "left",
                transition: "all 0.15s",
                borderLeft: isActive
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
              }}
            >
              <Icon
                d={item.icon}
                size={16}
                stroke={isActive ? "var(--accent-text)" : "var(--muted-foreground)"}
              />
              {language === "sw" ? item.labelSw : item.label}
            </button>
          );
        })}
      </nav>

      {showAccount && (
        <div
          style={{
            padding: "14px 14px 18px",
            borderTop: "1px solid var(--border)",
            opacity: 0.8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px",
              borderRadius: 9,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #b84c6e, #7c5cbf)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              👤
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                {language === "sw" ? "Mwenyeji wa Tukio" : "Event Host"}
              </div>
            </div>
          </div>
          <button
            className="btn-outline"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 12,
              marginTop: 8,
            }}
            onClick={logout}
          >
            {language === "sw" ? "Ondoka" : "Sign Out"}
          </button>
        </div>
      )}
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({
  view,
  user,
  language,
  theme,
  onLanguageChange,
  onThemeChange,
  onOpenMenu,
}: {
  view: View;
  user: PublicUser;
  language: DashboardLanguage;
  theme: DashboardTheme;
  onLanguageChange: (language: DashboardLanguage) => void;
  onThemeChange: (theme: DashboardTheme) => void;
  onOpenMenu?: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const labels: Record<View, { en: string; sw: string }> = {
    dashboard: { en: "Overview", sw: "Muhtasari" },
    events: { en: "My Events", sw: "Matukio Yangu" },
    "create-event": { en: "Create Event", sw: "Tengeneza Tukio" },
    templates: { en: "Templates", sw: "Miundo ya Kadi" },
    guests: { en: "Guest List", sw: "Orodha ya Wageni" },
    send: { en: "Send Invites", sw: "Tuma Mialiko" },
    "qr-verify": { en: "QR Verification", sw: "Uhakiki wa QR" },
    wallet: { en: "Wallet", sw: "Mkoba" },
    contributions: { en: "Contributions", sw: "Michango" },
    profile: { en: "My Profile", sw: "Wasifu Wangu" },
    settings: { en: "Account Settings", sw: "Mipangilio ya Akaunti" },
  };

  useEffect(() => {
    if (!profileOpen) return;

    const close = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  return (
    <header
      style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(10px, 3vw, 28px)",
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--background) 88%, transparent)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          color: "var(--muted-foreground)",
          fontWeight: 500,
          minWidth: 0,
          flex: 1,
        }}
      >
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={language === "sw" ? "Fungua menyu" : "Open menu"}
            className="md:hidden"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ☰
          </button>
        )}
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {labels[view][language]}
        </span>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <div
          className="hidden min-[390px]:flex"
          style={{
            alignItems: "center",
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
              onClick={() => onLanguageChange(item)}
              style={{
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                minWidth: 36,
                minHeight: 34,
                padding: "5px 7px",
                fontSize: 11,
                fontWeight: 600,
                background: language === item ? "var(--accent-text)" : "transparent",
                color:
                  language === item
                    ? "var(--accent-foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
            width: 44,
            height: 44,
            padding: 0,
            fontSize: 16,
            fontWeight: 600,
            background: "var(--card)",
            color: "var(--foreground)",
            lineHeight: 1,
          }}
          aria-label={
            theme === "dark"
              ? language === "sw"
                ? "Badili kwenda mwanga"
                : "Switch to light mode"
              : language === "sw"
                ? "Badili kwenda giza"
                : "Switch to dark mode"
          }
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <div className="hidden sm:block" style={{ height: 22, width: 1, background: "var(--border)" }} />
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label={language === "sw" ? "Fungua menyu ya wasifu" : "Open profile menu"}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "linear-gradient(135deg, var(--accent), #7c5cbf)",
              color: "var(--accent-foreground)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 18px rgba(7,10,20,0.12)",
            }}
          >
            👤
          </button>
          {profileOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: 52,
                width: "min(88vw, 280px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 18px 44px rgba(7,10,20,0.18)",
                padding: 8,
                zIndex: 30,
              }}
            >
              <div
                style={{
                  padding: "10px 10px 12px",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    color: "var(--foreground)",
                    fontSize: 14,
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.full_name || "User"}
                </div>
                <div
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    marginTop: 3,
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.email}
                </div>
              </div>
              {[
                {
                  label: language === "sw" ? "Wasifu Wangu" : "My Profile",
                  view: "profile" as View,
                },
                {
                  label:
                    language === "sw"
                      ? "Mipangilio ya Akaunti"
                      : "Account Settings",
                  view: "settings" as View,
                },
              ].map((item) => (
                <button
                  key={item.view}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    window.dispatchEvent(
                      new CustomEvent("dashboard:navigate", {
                        detail: item.view,
                      }),
                    );
                  }}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    border: 0,
                    borderRadius: 8,
                    background: "transparent",
                    color: "var(--foreground)",
                    textAlign: "left",
                    padding: "0 10px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                style={{
                  width: "100%",
                  minHeight: 44,
                  border: 0,
                  borderTop: "1px solid var(--border)",
                  marginTop: 6,
                  background: "transparent",
                  color: "var(--destructive)",
                  textAlign: "left",
                  padding: "8px 10px 0",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {language === "sw" ? "Toka" : "Log Out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
