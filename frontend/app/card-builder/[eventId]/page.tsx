"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CreditCard, Loader2, Search, Users, Wand2 } from "lucide-react";
import { getEvent, getGuests, getTemplates, getInvitations, generateEventCards, type Event, type Guest, type Invitation } from "@/lib/data";
import type { Template } from "@/lib/templates";
import InvitationCardPreview from "@/components/templates/InvitationCardPreview";

const PAGE_SIZE = 50;
const GENERATION_BATCH_SIZE = 100;

export default function CardBuilderPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [existing, setExisting] = useState<Invitation[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [previewGuestId, setPreviewGuestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(0);
  const generationLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextEvent, nextGuests, nextTemplates, nextCards] = await Promise.all([
        getEvent(eventId), getGuests(eventId), getTemplates(eventId), getInvitations(eventId),
      ]);
      setEvent(nextEvent);
      setGuests(nextGuests);
      // Card creation uses a design already saved to this event.
      const savedTemplates = nextTemplates.filter((template) => String(template.event) === eventId);
      setTemplates(savedTemplates);
      setTemplateId(savedTemplates[0]?.id ?? "");
      setExisting(nextCards);
      setPreviewGuestId(nextGuests[0]?.id ?? "");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load your event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const readyGuestIds = new Set(existing.map((card) => card.guest_id));
  const eligibleGuests = guests.filter((guest) => !readyGuestIds.has(guest.id));
  const selectedGuests = eligibleGuests.filter((guest) => selectedIds.has(guest.id));
  const filtered = guests.filter((guest) => `${guest.full_name} ${guest.phone ?? ""} ${guest.email ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleGuests = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const template = templates.find((item) => item.id === templateId);
  const previewGuest = guests.find((guest) => guest.id === previewGuestId);
  const previewCard = existing.find((card) => card.guest_id === previewGuestId);
  const allSelected = eligibleGuests.length > 0 && selectedGuests.length === eligibleGuests.length;

  const toggleGuest = (guest: Guest) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(guest.id)) next.delete(guest.id); else next.add(guest.id);
      return next;
    });
    setPreviewGuestId(guest.id);
  };

  const handleGenerate = async () => {
    if (!template || selectedGuests.length === 0 || generationLock.current) return;
    generationLock.current = true;
    setBusy(true);
    setError("");
    setCompleted(0);
    let done = 0;
    let created = 0;
    const generated: Invitation[] = [];
    try {
      for (let start = 0; start < selectedGuests.length; start += GENERATION_BATCH_SIZE) {
        const batch = selectedGuests.slice(start, start + GENERATION_BATCH_SIZE);
        const result = await generateEventCards(eventId, { guest_ids: batch.map((guest) => guest.id), template_id: template.id });
        generated.push(...result.invitations);
        created += result.created_count;
        done += batch.length;
        setCompleted(done);
      }
      router.push(`/events/${eventId}?generated=${created}`);
    } catch (failure) {
      // Keep successful cards after a partial batch failure so retry only creates missing cards.
      if (generated.length) {
        setExisting((current) => Array.from(new Map([...current, ...generated].map((card) => [card.guest_id, card])).values()));
        const generatedGuestIds = new Set(generated.map((card) => card.guest_id));
        setSelectedIds((current) => new Set([...current].filter((id) => !generatedGuestIds.has(id))));
      }
      setError(`${done ? `${done} guest cards are ready. ` : ""}${failure instanceof Error ? failure.message : "Unable to generate cards."} You can retry safely.`);
    } finally {
      generationLock.current = false;
      setBusy(false);
    }
  };

  if (loading) return <div className="cm-empty" role="status"><Loader2 className="animate-spin" /><p>Loading your event and guests…</p></div>;
  if (!event) return <div className="card-base cm-empty" role="alert"><h2>{error ? "Unable to load this event" : "Event not found"}</h2><p>{error}</p><button className="btn-outline cm-button" onClick={load}>Try again</button><Link href="/events">Back to events</Link></div>;

  return (
    <div className="card-management bulk-card-builder">
      <Link href={`/events/${eventId}`} className="cm-muted cm-button"><ArrowLeft size={16} />Back to {event.title}</Link>
      <header className="cm-heading"><div><p className="cm-eyebrow">PERSONAL INVITATIONS · ONE SIMPLE STEP</p><h1>Create guest cards</h1><p className="cm-muted">Select your guests. Each card will use your saved event design, the guest’s name, and a unique QR code and card ID.</p></div><span className="cm-chip">{event.title}</span></header>
      {error && <p className="card-base bulk-feedback" role="alert">{error}</p>}
      <div className="cm-stats">{[{ label: "Guests", value: guests.length }, { label: "Cards ready", value: existing.length }, { label: "Without a card", value: eligibleGuests.length }, { label: "Selected", value: selectedGuests.length }].map((stat) => <div className="card-base cm-stat" key={stat.label}><CreditCard size={19} /><div><span className="cm-muted">{stat.label}</span><strong>{stat.value}</strong></div></div>)}</div>
      <div className="cm-workspace">
        <section className="card-base cm-library">
          <div className="cm-section-heading"><div><h2>Choose your guests</h2><p className="cm-muted">Select everyone at once or choose a smaller group.</p></div><Users size={23} /></div>
          <div className="cm-toolbar"><button type="button" className="btn-outline cm-button" disabled={busy || eligibleGuests.length === 0} onClick={() => setSelectedIds(allSelected ? new Set() : new Set(eligibleGuests.map((guest) => guest.id)))}><Check size={16} />{allSelected ? "Clear selection" : `Select all ${eligibleGuests.length} guests`}</button><button type="button" className="btn-gold cm-button bulk-mobile-generate" disabled={busy || selectedGuests.length === 0 || !template} onClick={handleGenerate}>{busy ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}{busy ? `Generating ${completed}/${selectedGuests.length}…` : `Generate ${selectedGuests.length} cards`}</button><label className="cm-search"><Search size={17} /><input aria-label="Search guests" placeholder="Search name, phone or email" value={query} disabled={busy} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></label></div>
          {guests.length === 0 ? <div className="cm-empty"><Users size={32} /><h3>Add your guests first</h3><p className="cm-muted">Add or import your guest list to generate their invitation cards.</p><Link className="btn-gold cm-button" href={`/events/${eventId}?tab=guests`}>Manage guests<ArrowRight size={16} /></Link></div> : visibleGuests.length === 0 ? <div className="cm-empty"><p>No guests match your search.</p></div> : <div className="bulk-guest-list">{visibleGuests.map((guest) => {
            const ready = readyGuestIds.has(guest.id);
            return <div className="bulk-guest-row" key={guest.id}><label><input type="checkbox" aria-label={`Select ${guest.full_name}`} checked={selectedIds.has(guest.id) && !ready} disabled={busy || ready} onChange={() => toggleGuest(guest)} /><span><strong>{guest.full_name}</strong><small>{guest.phone || guest.email || guest.category || "Guest"}</small></span></label><span className="cm-chip">{ready ? "Card ready" : "No card yet"}</span><button className="bulk-preview-button" onClick={() => setPreviewGuestId(guest.id)} aria-label={`Preview ${guest.full_name}`}>Preview</button></div>;
          })}</div>}
          {guests.length > 0 && <div className="cm-library-footer"><span className="cm-muted">{selectedGuests.length} selected across your entire guest list</span><div className="cm-actions"><button className="btn-outline cm-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="cm-muted">{currentPage} / {pageCount}</span><button className="btn-outline cm-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>}
        </section>
        <aside className="card-base cm-preview bulk-generation-panel">
          <div className="cm-section-heading"><div><p className="cm-eyebrow">YOUR SAVED DESIGN</p><h2>Ready to personalize</h2></div></div>
          {templates.length === 0 ? <div className="cm-empty"><p>No design is saved for this event. Save an event design before generating cards.</p><Link href={`/events/${eventId}`} className="btn-outline cm-button">Back to event</Link></div> : <>
            {templates.length > 1 && <label className="bulk-design-select"><span className="cm-muted">Saved event design</span><select value={templateId} disabled={busy} onChange={(e) => setTemplateId(e.target.value)}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            <div className="cm-preview-canvas"><InvitationCardPreview event={event} guest={previewGuest} template={template} invitation={previewCard} /></div><p className="cm-muted cm-preview-caption">{previewGuest?.full_name ?? "Select a guest to preview"} · {template?.name}</p>
            <p className="cm-muted bulk-generation-note">Your event details and saved design stay the same. Every selected guest gets their own name, card ID, and scannable QR code.</p>
            {busy && <div className="bulk-progress" role="status"><progress value={completed} max={selectedGuests.length} /><span>{completed} / {selectedGuests.length} guest cards ready</span></div>}
            <button className="btn-gold cm-button" disabled={busy || selectedGuests.length === 0 || !template} onClick={handleGenerate}>{busy ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}{busy ? "Generating cards…" : `Generate ${selectedGuests.length} cards`}</button>
          </>}
          {eligibleGuests.length === 0 && guests.length > 0 && <p className="cm-muted bulk-generation-note">Every guest already has a card. View them in card management.</p>}
        </aside>
      </div>
    </div>
  );
}
