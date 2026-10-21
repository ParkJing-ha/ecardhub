"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, CreditCard, Layers, Loader2, MapPin, Plus, Search, Send, Users } from "lucide-react";
import { getEvent, getGuests, getInvitations, getTemplates, type Event, type Guest, type Invitation } from "@/lib/data";
import { allTemplates, type Template } from "@/lib/templates";
import { formatDate } from "@/lib/constants";
import InvitationCardPreview from "@/components/templates/InvitationCardPreview";
import type { Event as DashboardEvent } from "../types";

type CardData = { event: Event; guests: Guest[]; invitations: Invitation[]; templates: Template[] };

export function CardManagementView({ events, initialEventId, initialData, embedded = false }: {
  events: DashboardEvent[];
  initialEventId?: string | null;
  initialData?: CardData;
  embedded?: boolean;
}) {
  const router = useRouter();
  const eventId = initialEventId || events[0]?.id || "";
  const [loadedData, setData] = useState<CardData | null>(null);
  const data = initialData ?? loadedData;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError("");
      setData(null);
      setQuery("");
      setFilter("all");
      setPreviewId(null);
    });
    if (!eventId) {
      queueMicrotask(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }
    Promise.all([getEvent(eventId), getGuests(eventId), getInvitations(eventId), getTemplates(eventId)])
      .then(([event, guests, invitations, templates]) => {
        if (!active) return;
        if (!event) throw new Error("This event could not be found.");
        setData({ event, guests, invitations, templates });
      })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Unable to load your cards."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, retry, initialData]);

  const dashboardHref = (view: string) => `/dashboard?view=${view}&event=${encodeURIComponent(eventId)}`;
  const builderHref = `/card-builder/${encodeURIComponent(eventId)}`;
  const invitations = data?.invitations ?? [];
  const preview = invitations.find((card) => card.id === previewId) ?? invitations[0];
  const templates = allTemplates(data?.templates ?? []);
  const template = templates.find((item) => item.id === preview?.template_id) ?? templates[0];
  const guest = data?.guests.find((item) => item.id === preview?.guest_id);
  const sent = invitations.filter((card) => ["sent", "delivered"].includes(card.status)).length;
  const drafts = invitations.filter((card) => ["draft", "queued"].includes(card.status)).length;
  const cards = invitations.filter((card) => (filter === "all" || (filter === "draft" ? ["draft", "queued"].includes(card.status) : ["sent", "delivered"].includes(card.status))) && `${card.guest_name} ${card.invitation_code}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="card-management">
      {!embedded && <header className="cm-heading">
        <div><p className="cm-eyebrow">YOUR INVITATION STUDIO</p><h1>Card management</h1><p className="cm-muted">Bring your event to life, one invitation at a time.</p></div>
        {events.length > 0 && <label className="cm-event-picker"><span className="cm-muted">Manage cards for</span><select value={eventId} onChange={(e) => router.push(`/dashboard?view=cards&event=${encodeURIComponent(e.target.value)}`)}>{!events.some((event) => event.id === eventId) && <option value={eventId}>Selected event</option>}{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>}
      </header>}

      {!eventId ? <section className="card-base cm-empty"><Layers size={36} /><h2>Your next celebration starts here</h2><p className="cm-muted">Create an event to start managing its invitation cards.</p><Link className="btn-gold cm-button" href="/dashboard?view=create-event"><Plus size={17} />Create an event</Link></section>
        : loading && !initialData ? <div className="card-base cm-empty" role="status"><Loader2 className="animate-spin" size={28} /><p>Loading your event cards…</p></div>
        : error ? <div className="card-base cm-empty" role="alert"><h2>We couldn’t load your cards</h2><p className="cm-muted">{error}</p><button className="btn-outline cm-button" onClick={() => setRetry((value) => value + 1)}>Try again</button><Link href="/dashboard?view=events">Back to events</Link></div>
        : data && <>
          {!embedded && <section className="cm-hero card-base">
            <div><span className="cm-chip"><Check size={14} /> Event ready</span><h2>{data.event.title}</h2><div className="cm-event-meta"><span><CalendarDays size={16} />{formatDate(data.event.event_date)}</span><span><MapPin size={16} />{data.event.venue}</span></div><p className="cm-muted">Your event is saved. Create personalized cards, review every detail, and prepare your guest invitations here.</p><div className="cm-actions"><Link href={builderHref} className="btn-gold cm-button"><Plus size={18} />{invitations.length ? "Create more cards" : "Create cards"}<ArrowRight size={16} /></Link><Link href={`/events/${eventId}?tab=guests`} className="btn-outline cm-button"><Users size={17} />Manage guests</Link></div></div>
            <div className="cm-hero-mark" aria-hidden="true"><Layers size={62} strokeWidth={1} /><span>Made for your moment</span></div>
          </section>}

          <div className="cm-stats">{[{ label: "Guest list", value: data.guests.length, icon: Users }, { label: "Cards created", value: invitations.length, icon: CreditCard }, { label: "Ready to send", value: drafts, icon: Layers }, { label: "Marked sent", value: sent, icon: Send }].map(({ label, value, icon: Icon }) => <div className="card-base cm-stat" key={label}><span className="cm-stat-icon"><Icon size={20} /></span><div><span className="cm-muted">{label}</span><strong>{value}</strong></div></div>)}</div>

          <div className="cm-workspace">
            <section className="card-base cm-library">
              <div className="cm-section-heading"><div><h2>Invitation cards</h2><p className="cm-muted">Personal invitations for your guests.</p></div><span className="cm-chip">{invitations.length} cards</span></div>
              <div className="cm-toolbar"><div className="cm-filters" aria-label="Filter cards">{[{ value: "all", label: "All cards" }, { value: "draft", label: "Drafts" }, { value: "sent", label: "Sent" }].map((item) => <button key={item.value} aria-pressed={filter === item.value} className={filter === item.value ? "cm-filter-active" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><label className="cm-search"><Search size={17} /><input aria-label="Search invitation cards" placeholder="Search guest or card code" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
              {invitations.length === 0 ? <div className="cm-empty"><span className="cm-empty-icon"><CreditCard size={32} strokeWidth={1.5} /></span><h3>Your first invitation is waiting</h3><p className="cm-muted">{data.guests.length ? "Your guest list is ready. Select your guests in the card builder and generate their personalized invitations." : "Add your guests, then open the card builder to create their personalized invitations."}</p><Link href={data.guests.length ? builderHref : `/events/${eventId}?tab=guests`} className="btn-outline cm-button">{data.guests.length ? "Create your first cards" : "Add your guests"}<ArrowRight size={16} /></Link></div>
                : cards.length === 0 ? <div className="cm-empty"><Search size={28} /><h3>No matching cards</h3><p className="cm-muted">Try another guest name or choose a different filter.</p></div>
                : <div className="cm-card-list">{cards.map((card) => <button className={`cm-card-row ${preview?.id === card.id ? "cm-card-row-selected" : ""}`} aria-pressed={preview?.id === card.id} key={card.id} onClick={() => setPreviewId(card.id)}><span className="cm-avatar">{card.guest_name.slice(0, 1).toUpperCase()}</span><span className="cm-card-person"><strong>{card.guest_name}</strong><small>{card.invitation_code} · {card.channel}</small></span><span className="cm-card-status">{card.status}</span><ArrowRight size={16} /></button>)}</div>}
              {invitations.length > 0 && <div className="cm-library-footer"><span className="cm-muted">Review your cards before sending.</span><Link href={dashboardHref("send")} className="btn-outline cm-button"><Send size={16} />Send invitations</Link></div>}
            </section>

            <aside className="card-base cm-preview"><div className="cm-section-heading"><div><p className="cm-eyebrow">A LITTLE PREVIEW</p><h2>{preview ? "Selected invitation" : "Your event design"}</h2></div></div><div className="cm-preview-canvas"><InvitationCardPreview event={data.event} guest={guest} template={template} code={preview?.invitation_code} message={preview?.customized_text} invitation={preview} allowDownload /></div><p className="cm-muted cm-preview-caption">{preview ? `Invitation for ${preview.guest_name}` : template?.name || "Personalize your design in the card builder."}</p><Link href={builderHref} className="btn-outline cm-button">Open card builder<ArrowRight size={16} /></Link></aside>
          </div>
        </>}
    </div>
  );
}
