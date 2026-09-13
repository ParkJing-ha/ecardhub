"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useAppPreferences } from "../AppPreferencesProvider";
import { CATEGORIES, TEMPLATES } from "../../utils/mockData";

// Floating card preview for the hero
function HeroCardPreview() {
  const [activeIdx, setActiveIdx] = useState(0);
  const showcaseTemplates = [
    TEMPLATES[0],
    TEMPLATES[2],
    TEMPLATES[6],
    TEMPLATES[1],
  ];

  useEffect(() => {
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % showcaseTemplates.length),
      3200,
    );
    return () => clearInterval(id);
  }, [showcaseTemplates.length]);

  const tpl = showcaseTemplates[activeIdx];
  const cat = CATEGORIES.find((c) => c.id === tpl.categoryId);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ minHeight: "460px" }}
    >
      {/* Glow behind */}
      <div
        style={{
          position: "absolute",
          inset: "20%",
          background: `radial-gradient(ellipse, ${tpl.accentColor}30, transparent 70%)`,
          filter: "blur(40px)",
          transition: "background 1s ease",
        }}
      />

      {/* Stacked ghost cards */}
      {[2, 1].map((offset) => (
        <div
          key={offset}
          className="absolute rounded-2xl"
          style={{
            width: "240px",
            aspectRatio: "3/4",
            background:
              showcaseTemplates[(activeIdx + offset) % showcaseTemplates.length]
                .bgGradient,
            transform: `rotate(${
              offset === 1 ? 6 : 10
            }deg) translateX(${offset * 18}px) translateY(${offset * 8}px)`,
            opacity: offset === 1 ? 0.45 : 0.2,
            transition: "all 0.7s ease",
          }}
        />
      ))}

      {/* Main card */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-between text-center"
        style={{
          width: "240px",
          aspectRatio: "3/4",
          background: tpl.bgGradient,
          padding: "32px 24px",
          transition: "all 0.7s ease",
          zIndex: 2,
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-15%",
            width: "60%",
            paddingBottom: "60%",
            background: `radial-gradient(circle, ${tpl.accentColor}25, transparent 70%)`,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "22%",
            right: "22%",
            height: "2px",
            background: tpl.accentColor,
            borderRadius: "0 0 2px 2px",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: tpl.accentColor,
              marginBottom: "10px",
            }}
          >
            {cat?.emoji} {cat?.label.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "1.5rem",
              color: tpl.textColor,
              lineHeight: 1.2,
              marginBottom: "10px",
            }}
          >
            {tpl.title}
          </div>
          <div
            style={{
              color: tpl.accentColor,
              fontSize: "0.75rem",
              marginBottom: "8px",
            }}
          >
            ✦ ✦ ✦
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              color: tpl.textColor,
              opacity: 0.7,
              fontStyle: "italic",
            }}
          >
            {tpl.subtitle}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.55rem",
              color: tpl.accentColor,
              marginBottom: "6px",
            }}
          >
            September 15, 2026
          </div>
          <div
            style={{
              fontSize: "0.6rem",
              color: tpl.textColor,
              opacity: 0.55,
              fontStyle: "italic",
            }}
          >
            The Grand Ballroom
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="absolute flex gap-2" style={{ bottom: "0" }}>
        {showcaseTemplates.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="rounded-full transition-all"
            style={{
              width: i === activeIdx ? "20px" : "6px",
              height: "6px",
              background: i === activeIdx ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Step component for How It Works
function Step({
  number,
  icon,
  title,
  desc,
  isLast,
}: {
  number: number;
  icon: string;
  title: string;
  desc: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Number badge */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10"
        style={{
          background: "var(--brand-surface)",
          border: "2px solid rgba(196,164,90,0.3)",
        }}
      >
        {icon}
      </div>
      {/* Connector arrow */}
      {!isLast && (
        <div
          className="hidden md:flex absolute top-7 items-center"
          style={{
            left: "calc(50% + 36px)",
            width: "calc(100% - 72px)",
            zIndex: 0,
          }}
        >
          <div
            style={{ flex: 1, height: "1px", background: "var(--border)" }}
          />
          <div
            style={{
              color: "var(--accent-text)",
              fontSize: "1rem",
              marginLeft: "4px",
            }}
          >
            ›
          </div>
        </div>
      )}
      <div
        className="font-mono-label text-xs mb-2"
        style={{ color: "var(--accent-text)" }}
      >
        STEP {number.toString().padStart(2, "0")}
      </div>
      <div
        className="font-display text-xl mb-2"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </div>
      <p
        className="text-sm max-w-xs"
        style={{ color: "var(--muted-foreground)", lineHeight: 1.65 }}
      >
        {desc}
      </p>
    </div>
  );
}

// Pricing card
function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  cta,
  href,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  href: string;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl p-7 relative overflow-hidden"
      style={{
        background: highlighted ? "var(--primary)" : "var(--card)",
        border: highlighted ? "none" : "1px solid var(--border)",
        transform: highlighted ? "scale(1.04)" : "none",
      }}
    >
      {highlighted && (
        <>
          <div
            style={{
              position: "absolute",
              top: "-30%",
              right: "-20%",
              width: "70%",
              paddingBottom: "70%",
              background:
                "radial-gradient(circle, rgba(196,164,90,0.15), transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <span
            className="absolute top-5 right-5 font-mono-label text-xs px-2.5 py-1 rounded-full"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            POPULAR
          </span>
        </>
      )}
      <div
        className="font-mono-label text-xs tracking-widest mb-3 uppercase"
        style={{
          color: highlighted
            ? "rgba(196,164,90,0.8)"
            : "var(--muted-foreground)",
        }}
      >
        {name}
      </div>
      <div
        className="font-display mb-1"
        style={{
          fontSize: "2.5rem",
          color: highlighted ? "var(--accent)" : "var(--foreground)",
          lineHeight: 1,
        }}
      >
        {price}
      </div>
      <div
        className="text-xs mb-6"
        style={{
          color: highlighted
            ? "rgba(247,244,239,0.5)"
            : "var(--muted-foreground)",
        }}
      >
        {period}
      </div>
      <ul className="flex flex-col gap-2.5 mb-7 flex-1">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-sm"
            style={{
              color: highlighted
                ? "rgba(247,244,239,0.8)"
                : "var(--foreground)",
            }}
          >
            <span
              style={{
                color: "var(--accent-text)",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="w-full py-3 rounded-lg text-sm font-semibold"
        style={{
          display: "block",
          background: highlighted ? "var(--accent)" : "transparent",
          color: highlighted
            ? "var(--accent-foreground)"
            : "var(--foreground)",
          border: highlighted ? "none" : "1px solid var(--border)",
          fontFamily: "'Outfit', sans-serif",
          textAlign: "center",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          if (!highlighted) {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!highlighted) {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--foreground)";
          }
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const { language, resolvedTheme, setLanguage, setTheme, t } =
    useAppPreferences();
  const registerHref = "/auth?mode=register&next=/dashboard?view=create-event";
  const loginHref = "/auth?mode=login";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: "home", label: t(language, "nav", "home") },
    { id: "templates", label: t(language, "nav", "templates") },
    { id: "gallery", label: t(language, "nav", "gallery") },
    { id: "pricing", label: t(language, "nav", "pricing") },
    { id: "about", label: t(language, "nav", "about") },
  ];

  const popularCats = [
    CATEGORIES.find((c) => c.id === "graduation")!,
    CATEGORIES.find((c) => c.id === "wedding")!,
    CATEGORIES.find((c) => c.id === "birthday")!,
    CATEGORIES.find((c) => c.id === "babyshower")!,
  ];

  const steps = [
    {
      icon: "🎨",
      title: "Choose Template",
      desc: "Browse 50+ beautifully designed templates across 10 occasion categories.",
    },
    {
      icon: "✏️",
      title: "Customize",
      desc: "Add your details, upload photos, personalize fonts, colors, and your message.",
    },
    {
      icon: "📤",
      title: "Share",
      desc: "Send instantly via Email, WhatsApp, or SMS. Track views and RSVPs in real time.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "TZS 0",
      period: "Forever free",
      features: [
        "5 cards per month",
        "Basic templates",
        "Email sharing",
        "QR code generation",
        "RSVP tracking",
      ],
      cta: "Get Started Free",
    },
    {
      name: "Pro",
      price: "TZS 9,900",
      period: "per month · billed monthly",
      features: [
        "Unlimited cards",
        "All 50+ templates",
        "SMS + WhatsApp dispatch",
        "Guest list management",
        "Advanced analytics",
        "Custom branding",
        "Priority support",
      ],
      highlighted: true,
      cta: "Start Pro Trial",
    },
    {
      name: "Enterprise",
      price: "TZS 29,900",
      period: "per month · billed monthly",
      features: [
        "Everything in Pro",
        "Bulk SMS dispatch",
        "API access",
        "White-label option",
        "Dedicated account manager",
        "SLA 99.5% uptime",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* ─── NAVBAR ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: "var(--brand-surface)",
          borderBottom: "1px solid rgba(196,164,90,0.18)",
          boxShadow: "0 10px 30px rgba(15,18,32,0.22)",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
          style={{ backgroundColor: "var(--brand-surface)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <BrandLogo size={34} />
            <span
              className="font-display text-xl tracking-wide"
              style={{ color: "var(--accent-text)" }}
            >
              {t(language, "common", "appName")}
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: "rgba(247,244,239,0.7)",
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(247,244,239,0.7)";
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Login + CTA */}
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex"
              style={{
                alignItems: "center",
                gap: 4,
                padding: 3,
                border: "1px solid rgba(196,164,90,0.35)",
                borderRadius: 8,
              }}
            >
              {(["en", "sw"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  style={{
                    minWidth: 36,
                    minHeight: 34,
                    border: 0,
                    borderRadius: 6,
                    background: language === item ? "var(--accent)" : "transparent",
                    color:
                      language === item
                        ? "var(--accent-foreground)"
                        : "rgba(247,244,239,0.75)",
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
                border: "1px solid rgba(196,164,90,0.35)",
                background: "transparent",
                color: "var(--accent-text)",
              }}
              aria-label={
                resolvedTheme === "dark"
                  ? t(language, "common", "lightMode")
                  : t(language, "common", "darkMode")
              }
            >
              {resolvedTheme === "dark" ? "☀" : "☾"}
            </button>
            <Link
              href={loginHref}
              className="hidden md:block px-5 py-2 rounded-lg text-sm font-medium"
              style={{
                color: "rgba(247,244,239,0.85)",
                background: "transparent",
                border: "1px solid rgba(196,164,90,0.35)",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
              }}
            >
              {t(language, "common", "signIn")}
            </Link>
            <Link
              href={registerHref}
              className="hidden md:inline-flex px-5 py-2 rounded-lg text-sm font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
              }}
            >
              {t(language, "common", "startFree")}
            </Link>
            {/* Mobile menu toggle */}
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? t(language, "common", "closeMenu")
                  : t(language, "common", "openMenu")
              }
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2"
              onClick={() => {
                setMobileMenuOpen((o) => !o);
              }}
              style={{
                color: "var(--accent-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="absolute top-full left-0 right-0 md:hidden px-6 py-5 flex flex-col gap-2"
            style={{
              background: "var(--brand-surface)",
              borderTop: "1px solid rgba(196,164,90,0.15)",
              boxShadow: "0 18px 35px rgba(0,0,0,0.18)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="py-2.5 text-sm font-medium"
                style={{
                  color: "rgba(247,244,239,0.75)",
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href={loginHref}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-left"
              style={{
                color: "var(--accent-text)",
                background: "none",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
              }}
            >
              {t(language, "common", "signIn")}
            </Link>
            <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
              {(["en", "sw"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 8,
                    border: "1px solid rgba(196,164,90,0.35)",
                    background: language === item ? "var(--accent)" : "transparent",
                    color:
                      language === item
                        ? "var(--accent-foreground)"
                        : "rgba(247,244,239,0.8)",
                  }}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section
        id="home"
        className="relative overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Background: left dark, right light split */}
        <div className="absolute inset-0 flex">
          <div
            className="w-full lg:w-1/2"
            style={{ background: "var(--brand-surface)" }}
          />
          <div
            className="hidden lg:block w-1/2"
            style={{ background: "var(--secondary)" }}
          />
        </div>
        {/* Subtle diagonal overlay */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(105deg, transparent 48%, var(--secondary) 48%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="relative max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-0"
          style={{
            paddingTop: "120px",
            paddingBottom: "80px",
            minHeight: "100vh",
          }}
        >
          {/* Left copy */}
          <div className="flex-1 lg:pr-16 z-10">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(196,164,90,0.15)",
                border: "1px solid rgba(196,164,90,0.3)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "var(--accent)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                className="font-mono-label text-xs tracking-wide"
                style={{ color: "var(--accent-text)" }}
              >
                {t(language, "landing", "eyebrow")}
              </span>
            </div>

            <h1
              className="font-display leading-tight mb-6"
              style={{
                fontSize: "clamp(2.6rem, 6vw, 4.5rem)",
                color: "var(--brand-surface-foreground)",
              }}
            >
              {t(language, "landing", "headline")}
            </h1>

            <p
              className="text-base mb-8 max-w-lg"
              style={{ color: "rgba(247,244,239,0.65)", lineHeight: 1.8 }}
            >
              {t(language, "landing", "body")}
            </p>

            <div className="flex gap-4 flex-wrap mb-10">
              <Link
                href={registerHref}
                className="px-7 py-3.5 rounded-xl text-base font-semibold flex items-center gap-2"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  fontFamily: "'Outfit', sans-serif",
                  textDecoration: "none",
                }}
              >
                {t(language, "landing", "primaryCta")}
                <span>→</span>
              </Link>
              <Link
                href={loginHref}
                className="px-7 py-3.5 rounded-xl text-base font-medium"
                style={{
                  color: "rgba(247,244,239,0.8)",
                  background: "transparent",
                  border: "1px solid rgba(196,164,90,0.3)",
                  fontFamily: "'Outfit', sans-serif",
                  textDecoration: "none",
                }}
              >
                {t(language, "landing", "secondaryCta")}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-5 flex-wrap">
              {[
                { icon: "⚡", text: t(language, "landing", "ready") },
                { icon: "📱", text: t(language, "landing", "channels") },
                { icon: "🔐", text: t(language, "landing", "secure") },
                { icon: "TZ", text: t(language, "landing", "localized") },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span
                    className="text-sm"
                    style={{
                      color: "rgba(247,244,239,0.55)",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: animated card preview */}
          <div className="flex-1 flex flex-col items-center gap-4 z-10">
            <div
              className="font-mono-label text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t(language, "landing", "preview")}
            </div>
            <HeroCardPreview />
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ zIndex: 10 }}
        >
          <span
            className="font-mono-label text-xs"
            style={{ color: "rgba(196,164,90,0.5)" }}
          >
            scroll
          </span>
          <div
            className="w-px h-8"
            style={{
              background:
                "linear-gradient(to bottom, rgba(196,164,90,0.5), transparent)",
            }}
          />
        </div>
      </section>

      {/* ─── POPULAR CATEGORIES ─── */}
      <section
        id="templates"
        className="py-24"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="font-mono-label text-xs tracking-widest mb-3 uppercase"
              style={{ color: "var(--accent-text)" }}
            >
              Occasions
            </div>
            <h2
              className="font-display text-4xl md:text-5xl mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Popular Categories
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "var(--muted-foreground)", lineHeight: 1.75 }}
            >
              From intimate celebrations to grand events — we have a template
              for every milestone.
            </p>
          </div>

          {/* 4 featured categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {popularCats.map((cat) => {
              const tpl = TEMPLATES.find((t) => t.categoryId === cat.id)!;
              return (
                <Link
                  key={cat.id}
                  href={registerHref}
                  className="group flex flex-col rounded-2xl overflow-hidden text-left"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  {/* Card visual */}
                  <div
                    className="relative overflow-hidden flex flex-col items-center justify-center text-center"
                    style={{
                      background: tpl.bgGradient,
                      padding: "28px 20px",
                      aspectRatio: "4/3",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-20%",
                        right: "-15%",
                        width: "55%",
                        paddingBottom: "55%",
                        background: `radial-gradient(circle, ${tpl.accentColor}22, transparent 70%)`,
                        borderRadius: "50%",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "20%",
                        right: "20%",
                        height: "2px",
                        background: tpl.accentColor,
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div className="text-4xl mb-3">{cat.emoji}</div>
                      <div
                        style={{
                          fontFamily: "'DM Serif Display', serif",
                          fontSize: "1rem",
                          color: tpl.textColor,
                          lineHeight: 1.3,
                        }}
                      >
                        {tpl.title}
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <div
                        className="font-display text-base mb-0.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        {cat.emoji} {cat.label}
                      </div>
                      <div
                        className="font-mono-label text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {
                          TEMPLATES.filter((t) => t.categoryId === cat.id)
                            .length
                        }{" "}
                        templates
                      </div>
                    </div>
                    <span
                      className="text-sm transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--accent-text)" }}
                    >
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* All categories row */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.slice(4).map((cat) => (
              <Link
                key={cat.id}
                href={registerHref}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="gallery"
        style={{ background: "var(--secondary)", padding: "96px 0" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="font-mono-label text-xs tracking-widest mb-3 uppercase"
              style={{ color: "var(--accent-text)" }}
            >
              Process
            </div>
            <h2
              className="font-display text-4xl md:text-5xl mb-4"
              style={{ color: "var(--foreground)" }}
            >
              How It Works
            </h2>
            <p
              className="text-base max-w-md mx-auto"
              style={{ color: "var(--muted-foreground)", lineHeight: 1.75 }}
            >
              From idea to sent invitation in under 3 minutes. No design skills
              required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((step, idx) => (
              <Step
                key={step.title}
                number={idx + 1}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
                isLast={idx === steps.length - 1}
              />
            ))}
          </div>

          {/* Vertical connector for mobile */}
          <div className="flex md:hidden flex-col items-center my-2 gap-1">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-px h-8"
                style={{ background: "var(--border)" }}
              />
            ))}
          </div>

          {/* CTA inside How It Works */}
          <div className="text-center mt-14">
            <Link
              href={registerHref}
              className="px-8 py-4 rounded-xl text-base font-semibold"
              style={{
                background: "var(--brand-surface)",
                color: "var(--brand-surface-foreground)",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Create Your First Card — Free
            </Link>
            <p
              className="text-xs mt-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              No credit card required · 5 free cards included
            </p>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section style={{ background: "var(--brand-surface)", padding: "56px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "128K+", label: "Invitations Sent" },
              { value: "50+", label: "Design Templates" },
              { value: "99.5%", label: "Platform Uptime" },
              { value: "<30s", label: "Delivery Time" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  className="font-display mb-2"
                  style={{ fontSize: "2.5rem", color: "var(--accent-text)" }}
                >
                  {value}
                </div>
                <div
                  className="text-sm"
                  style={{
                    color: "rgba(247,244,239,0.55)",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section
        id="pricing"
        className="py-24"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="font-mono-label text-xs tracking-widest mb-3 uppercase"
              style={{ color: "var(--accent-text)" }}
            >
              Pricing
            </div>
            <h2
              className="font-display text-4xl md:text-5xl mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Simple, transparent pricing
            </h2>
            <p
              className="text-base max-w-md mx-auto"
              style={{ color: "var(--muted-foreground)", lineHeight: 1.75 }}
            >
              Start free. Upgrade when you need more power. Pay with M-Pesa,
              Airtel Money, Tigo Pesa, or card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} href={registerHref} />
            ))}
          </div>

          {/* Payment logos */}
          <div className="flex items-center justify-center gap-4 mt-10 flex-wrap">
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              Accepted payments:
            </span>
            {[
              "📱 M-Pesa",
              "📲 Airtel Money",
              "📳 Tigo Pesa",
              "💳 Visa / Mastercard",
            ].map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section
        id="about"
        style={{ background: "var(--secondary)", padding: "96px 0" }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div
            className="font-mono-label text-xs tracking-widest mb-3 uppercase"
            style={{ color: "var(--accent-text)" }}
          >
            About
          </div>
          <h2
            className="font-display text-4xl md:text-5xl mb-6"
            style={{ color: "var(--foreground)" }}
          >
            Built for every occasion,
            <br />
            <em style={{ color: "var(--accent-text)" }}>everywhere</em>
          </h2>
          <p
            className="text-base max-w-2xl mx-auto mb-10"
            style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
          >
            EcardHub was designed to make beautiful digital invitations
            accessible to everyone — from families celebrating milestones to
            corporations hosting conferences. With full Swahili localization,
            mobile money payment support, and offline-friendly SMS delivery, we
            are built for East Africa and the world.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              "🇹🇿 Made for East Africa",
              "🌍 Available Worldwide",
              "🔒 End-to-End Secure",
              "♿ Accessibility First",
            ].map((badge) => (
              <span
                key={badge}
                className="px-4 py-2 rounded-full"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section style={{ background: "var(--brand-surface)", padding: "80px 0" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div
            className="font-display text-4xl md:text-5xl mb-5 leading-tight"
            style={{ color: "var(--brand-surface-foreground)" }}
          >
            Ready to create your first invitation?
          </div>
          <p
            className="text-base mb-8"
            style={{ color: "rgba(247,244,239,0.6)", lineHeight: 1.75 }}
          >
            Join 128,000+ users sending beautiful digital cards every day.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={registerHref}
              className="px-8 py-4 rounded-xl text-base font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
              }}
            >
              Start Free →
            </Link>
            <Link
              href={loginHref}
              className="px-8 py-4 rounded-xl text-base font-medium"
              style={{
                color: "rgba(247,244,239,0.8)",
                background: "transparent",
                border: "1px solid rgba(196,164,90,0.3)",
                fontFamily: "'Outfit', sans-serif",
                textDecoration: "none",
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          background: "var(--brand-surface)",
          borderTop: "1px solid rgba(196,164,90,0.1)",
          padding: "32px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size={28} />
            <span className="font-display" style={{ color: "var(--accent-text)" }}>
              {t(language, "common", "appName")}
            </span>
          </div>
          <div className="flex gap-5">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Support", href: "/support" },
              { label: "API", href: "/api-info" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs"
                style={{
                  color: "rgba(247,244,239,0.4)",
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(247,244,239,0.4)";
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div
            className="font-mono-label text-xs"
            style={{ color: "rgba(247,244,239,0.25)" }}
          >
            © 2026 {t(language, "common", "appName")} · 99.5% Uptime SLA
          </div>
        </div>
      </footer>
    </div>
  );
}
