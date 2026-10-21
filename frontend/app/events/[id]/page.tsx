"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loadEventDetail,
  createGuest,
  createGuests,
  getGuests,
  updateGuest,
  deleteGuest,
  sendInvitations,
  setRsvp,
  saveContribution,
  saveUsher,
  logAction,
  type Event,
  type Guest,
  type Invitation,
  type Contribution,
  type CheckIn,
  type Usher,
} from "@/lib/data";
import { allTemplates, type Template } from "@/lib/templates";
import { MAX_EVENT_GUESTS, parseGuestImportFile, prepareGuestImport } from "@/lib/guest-import";
import { formatDate, formatDateTime, INVITATION_CHANNEL_OPTIONS } from "@/lib/constants";
import { CardManagementView } from "@/components/dashboard/views/CardManagementView";
import { useAppPreferences } from "@/components/AppPreferencesProvider";
import InvitationCardPreview from "@/components/templates/InvitationCardPreview";
import { Badge } from "@/components/dashboard/ui";
import GuestDialog from "@/components/GuestDialog";
import ContributionDialog from "@/components/ContributionDialog";
import UsherDialog from "@/components/UsherDialog";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Trash2,
  Send,
  QrCode,
  Users,
  Search,
  Wand2,
  XCircle,
  ShieldCheck,
  Eye,
  HandCoins,
  Heart,
  Upload,
} from "lucide-react";

function normalizeRsvpStatus(
  status?: string,
): "Pending" | "Accepted" | "Declined" {
  switch (status?.toLowerCase()) {
    case "accepted":
      return "Accepted";

    case "declined":
    case "not_attending":
      return "Declined";

    default:
      return "Pending";
  }
}

export default function EventDetailPage() {
  const { resolvedTheme, setTheme } = useAppPreferences();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [ushers, setUshers] = useState<Usher[]>([]);
  const [tplMap, setTplMap] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [guestQuery, setGuestQuery] = useState("");
  const [guestFilter, setGuestFilter] = useState("all");
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const [guestImporting, setGuestImporting] = useState(false);
  const [guestImportMessage, setGuestImportMessage] = useState("");
  const [guestImportMessageIsError, setGuestImportMessageIsError] = useState(false);
  const guestImportInputRef = useRef<HTMLInputElement | null>(null);
  const guestImportInFlight = useRef(false);
  const activeEventIdRef = useRef(id);
  const loadVersion = useRef(0);

  const [guestOpen, setGuestOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [contribOpen, setContribOpen] = useState(false);
  const [usherOpen, setUsherOpen] = useState(false);
  const [previewInv, setPreviewInv] = useState<Invitation | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  useLayoutEffect(() => {
    activeEventIdRef.current = id;
    return () => { activeEventIdRef.current = ""; loadVersion.current += 1; };
  }, [id]);

  const loadAll = useCallback(async () => {
    if (activeEventIdRef.current !== id) return;
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const data = await loadEventDetail(id);
      if (activeEventIdRef.current !== id || loadVersion.current !== version) return;
      setEvent(data.event);
      setGuests(data.guests);
      setInvitations(data.invitations);
      setContributions(data.contributions);
      setCheckins(data.checkins);
      setUshers(data.ushers);
      setTplMap(data.tplMap);
    } catch (error) {
      if (activeEventIdRef.current !== id || loadVersion.current !== version) return;
      setLoadError(error instanceof Error ? error.message : "Unable to load this event.");
    } finally {
      if (activeEventIdRef.current === id && loadVersion.current === version) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(loadAll);
    queueMicrotask(() => {
      setGuestImportMessage("");
      setGuestImportMessageIsError(false);
      setGuestOpen(false);
      setEditGuest(null);
    });
  }, [loadAll]);

  useEffect(() => {
    const requested = searchParams.get("tab") || "overview";
    const allowed = ["overview", "guests", "invitations", "rsvp", "contributions", "checkins", "ushers"];
    queueMicrotask(() => setTab(allowed.includes(requested) ? requested : "overview"));
  }, [searchParams]);

  if (loading || (event && event.id !== id && !loadError)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (loadError) {
    return <div className="card-base cm-empty" role="alert"><h2>Unable to load your event</h2><p>{loadError}</p><button className="btn-outline cm-button" onClick={loadAll}>Try again</button><Link href="/events">Back to events</Link></div>;
  }
  if (!event) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <XCircle className="w-10 h-10 text-muted-foreground mb-3" />
        <h2 className="font-heading text-lg font-semibold">Event not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This event may have been deleted.
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-primary-foreground"
        >
          Back to events
        </Link>
      </div>
    );
  }

  // --- actions ---
  const onSaveGuest = async (form: Partial<Guest>) => {
    if (editGuest) {
      await updateGuest(id, editGuest.id, form);
    } else {
      if (guests.length >= MAX_EVENT_GUESTS) {
        throw new Error(`This event already has ${MAX_EVENT_GUESTS} guests. Remove a guest before adding another.`);
      }
      await createGuest(id, form);
    }
    setGuestOpen(false);
    setEditGuest(null);
    loadAll();
  };

  const onDeleteGuest = async (g: Guest) => {
    if (!confirm(`Remove ${g.full_name}?`)) return;
    await deleteGuest(id, g.id);
    loadAll();
  };

  const onImportGuests = async (file: File | null) => {
    if (!file || guestImportInFlight.current) return;
    const eventId = id;
    const importInput = guestImportInputRef.current;
    guestImportInFlight.current = true;

    setGuestImporting(true);
    setGuestImportMessage("");
    setGuestImportMessageIsError(false);

    try {
      const importedGuests = await parseGuestImportFile(file);

      if (importedGuests.length === 0) {
        throw new Error("No guest rows found. Include at least a Full Name column.");
      }

      const existingGuests = await getGuests(eventId);
      if (activeEventIdRef.current === eventId) setGuests(existingGuests);
      const prepared = prepareGuestImport(importedGuests, existingGuests);

      if (prepared.guests.length === 0) {
        if (activeEventIdRef.current === eventId) {
          setGuestImportMessage(`All guests in this file are already in the list. Skipped ${prepared.skipped_count} duplicate guests.`);
        }
        return;
      }

      const created = await createGuests(eventId, prepared.guests);

      if (activeEventIdRef.current === eventId) {
        setGuests([...existingGuests, ...created]);
        setGuestImportMessage(
          `Imported ${created.length} guests from ${file.name}.` +
            (prepared.skipped_count ? ` Skipped ${prepared.skipped_count} duplicate guests.` : ""),
        );
        void loadAll();
      }

      void logAction({
        action: "guest.import",
        entityType: "Event",
        entityId: eventId,
        details: `Imported ${created.length} guests from ${file.name}`,
      }).catch(() => {});
    } catch (error) {
      if (activeEventIdRef.current === eventId) {
        setGuestImportMessageIsError(true);
        setGuestImportMessage(error instanceof Error ? error.message : "Could not import guests.");
      }
    } finally {
      guestImportInFlight.current = false;
      if (activeEventIdRef.current) setGuestImporting(false);

      if (importInput) importInput.value = "";
    }
  };

  const onSend = async (channel: string) => {
    const targets = invitations.filter(
      (i) => i.status === "draft" || i.status === "queued",
    );
    if (targets.length === 0) {
      setSendOpen(false);
      return;
    }
    await sendInvitations(id, targets, channel);
    await logAction({
      action: "invitation.dispatch",
      entityType: "Event",
      entityId: id,
      details: `Sent ${targets.length} invitations via ${channel}`,
    });
    setSendOpen(false);
    loadAll();
  };

  const onSetRsvp = async (g: Guest, status: string) => {
    await setRsvp(id, g, status);
    loadAll();
  };

  const onSaveContribution = async (form: {
    guest_id: string;
    amount: number;
    contribution_type: string;
    card_type: string;
    notes: string;
  }) => {
    const g = guests.find((x) => x.id === form.guest_id);
    await saveContribution(id, form, g?.full_name || "Guest");
    await logAction({
      action: "contribution.record",
      entityType: "Event",
      entityId: id,
      details: `Recorded ${form.amount} from ${g?.full_name || "guest"}`,
    });
    setContribOpen(false);
    loadAll();
  };

  const onSaveUsher = async (form: {
    usher_name: string;
    usher_email: string;
    usher_phone: string;
    checkpoints: string[];
  }) => {
    await saveUsher(id, form);
    await logAction({
      action: "usher.assign",
      entityType: "Event",
      entityId: id,
      details: `Assigned usher ${form.usher_name}`,
    });
    setUsherOpen(false);
    loadAll();
  };

  // --- derived ---
  const filteredGuests = guests.filter((g) => {
    const q = guestQuery.toLowerCase();
    const matchQ =
      !q ||
      g.full_name?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.email?.toLowerCase().includes(q);
    const matchF =
      guestFilter === "all" ||
      g.category === guestFilter ||
      g.rsvp_status === guestFilter ||
      g.invitation_status === guestFilter;
    return matchQ && matchF;
  });

  const rsvpCounts = {
    attending: guests.filter((g) => g.rsvp_status === "attending").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    not_attending: guests.filter((g) => g.rsvp_status === "not_attending")
      .length,
    maybe: guests.filter((g) => g.rsvp_status === "maybe").length,
  };
  const contrTotal = contributions
    .filter((c) => c.status === "received")
    .reduce((s, c) => s + (c.amount || 0), 0);


  const TABS = [
    { key: "overview", label: "Card management" },
    { key: "guests", label: `Guests (${guests.length})` },
    { key: "invitations", label: `Invitations (${invitations.length})` },
    { key: "rsvp", label: "RSVP" },
    { key: "contributions", label: "Contributions" },
    { key: "checkins", label: `Check-ins (${checkins.length})` },
    { key: "ushers", label: `Ushers (${ushers.length})` },
  ];

  return (
    <div className="event-management mx-auto w-full max-w-7xl px-3 py-5 pb-8 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
      <Link
        href="/events"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>
      <button className="btn-outline cm-button mb-4" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
      </button>
      </div>

      {/* Header card */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:mb-6">
        <div className="event-studio-banner"><p className="cm-eyebrow">YOUR EVENT · YOUR INVITATION STUDIO</p><span>Made for your moment</span></div>
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                  {event.category}
                </span>
                <span className="rounded-md border border-border px-2 py-1 text-xs capitalize">
                  {event.status}
                </span>
                <span className="rounded-md border border-border px-2 py-1 text-xs">
                  {event.package}
                </span>
              </div>
              <h1 className="break-words font-heading text-2xl font-semibold leading-tight md:text-3xl">
                {event.title}
              </h1>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                {formatDate(event.event_date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {event.event_time && ` · ${event.event_time}`} · {event.venue}
              </p>
              {event.card_message && (
                <p className="mt-2 break-words text-sm italic leading-6 text-muted-foreground">
                  &ldquo;{event.card_message}&rdquo;
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
              <Link
                href={`/card-builder/${id}`}
                className="btn-gold cm-button"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Create Cards
              </Link>
              <button
                onClick={() => setSendOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      </div>

      {searchParams.get("generated") && /^\d+$/.test(searchParams.get("generated") ?? "") && (
        <p role="status" className="card-base mb-5 p-4">{searchParams.get("generated")} invitation cards generated and ready to send. Each card has its own guest name, card ID, and QR code.</p>
      )}

      <div className="card-base mb-5 px-4 py-3">
        <p className="text-sm font-semibold">{guests.length} / {MAX_EVENT_GUESTS} guests · {invitations.length} / {MAX_EVENT_GUESTS} cards</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Each event supports up to {MAX_EVENT_GUESTS} guests and {MAX_EVENT_GUESTS} personalised cards. Import skips duplicates and must fit the remaining spaces. You can still edit existing guests when the limit is reached.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition sm:px-4 ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div>
          <CardManagementView
            events={[]}
            initialEventId={id}
            embedded
            initialData={{ event, guests, invitations, templates: Object.values(tplMap).filter((template) => !template.id.startsWith("preset-")) }}
          />
          <div className="rounded-xl border border-border bg-card p-5 mt-5">
            <h3 className="font-heading font-semibold mb-3">Event details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Detail label="Host" value={event.host_name || "—"} />
              <Detail
                label="RSVP deadline"
                value={formatDate(event.rsvp_deadline)}
              />
              <Detail label="RSVP phone" value={event.rsvp_phone || "—"} />
              <Detail
                label="Contribution target"
                value={`TSh ${(event.contribution_target || 0).toLocaleString()}`}
              />
              <Detail label="Description" value={event.description || "—"} />
            </dl>
          </div>
        </div>
      )}

      {tab === "guests" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={guestQuery}
                onChange={(e) => setGuestQuery(e.target.value)}
                placeholder="Search guests..."
                className="h-11 w-full rounded-md border border-border bg-transparent pl-9 pr-3 text-base sm:text-sm"
              />
            </div>
            <select
              value={guestFilter}
              onChange={(e) => setGuestFilter(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-transparent px-2 text-base sm:text-sm lg:w-52"
            >
              <option value="all">All guests</option>
              <option value="Single">Single</option>
              <option value="Double/Couple">Double/Couple</option>
              <option value="VIP">VIP</option>
              <option value="attending">Attending</option>
              <option value="pending">RSVP pending</option>
              <option value="not_sent">Not yet invited</option>
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:ml-auto">
              <input
                ref={guestImportInputRef}
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="hidden"
                onChange={(e) => onImportGuests(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                disabled={guestImporting}
                onClick={() => guestImportInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
              >
                {guestImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import
              </button>
              <Link
                href={`/card-builder/${id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Create Cards
              </Link>
              <button
                disabled={guestImporting || guests.length >= MAX_EVENT_GUESTS}
                onClick={() => {
                  setEditGuest(null);
                  setGuestOpen(true);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add guest
              </button>
            </div>
          </div>
          {guestImportMessage && (
            <div role={guestImportMessageIsError ? "alert" : "status"} className={`mx-4 mt-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm ${guestImportMessageIsError ? "text-destructive" : "text-muted-foreground"}`}>
              {guestImportMessage}
            </div>
          )}
          {filteredGuests.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No guests found"
              description="Add guests individually or adjust your filters."
            />
          ) : (
            <GuestTable
              guests={filteredGuests}
              onEdit={(g) => {
                setEditGuest(g);
                setGuestOpen(true);
              }}
              onDelete={onDeleteGuest}
            />
          )}
        </div>
      )}

      {tab === "invitations" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-heading font-semibold">
              Generated invitation cards
            </h3>
            <Link
              href={`/card-builder/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Create Cards
            </Link>
          </div>
          {invitations.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No invitation cards yet"
              description="Generate QR-coded invitation cards for your guests."
            />
          ) : (
            <InvitationTable
              invitations={invitations}
              onPreview={(i) => setPreviewInv(i)}
            />
          )}
        </div>
      )}

      {tab === "rsvp" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <RsvpStat
              value={rsvpCounts.attending}
              label="Attending"
              tone="emerald"
            />
            <RsvpStat value={rsvpCounts.maybe} label="Maybe" tone="amber" />
            <RsvpStat value={rsvpCounts.pending} label="Pending" tone="muted" />
            <RsvpStat
              value={rsvpCounts.not_attending}
              label="Not attending"
              tone="rose"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border p-3 sm:p-4">
              <h3 className="font-heading font-semibold">RSVP responses</h3>
            </div>
            {guests.length === 0 ? (
              <EmptyState icon={Heart} title="No guests yet" />
            ) : (
              <RsvpTable guests={guests} onSet={onSetRsvp} />
            )}
          </div>
        </div>
      )}

      {tab === "contributions" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading font-semibold">Contributions</h3>
              <p className="text-sm text-muted-foreground">
                Total received: TSh {contrTotal.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setContribOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record contribution
            </button>
          </div>
          {contributions.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="No contributions yet"
              description="Record cash and mobile money contributions for this event."
            />
          ) : (
            <ContributionTable contributions={contributions} />
          )}
        </div>
      )}

      {tab === "checkins" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-heading font-semibold">Guest check-ins</h3>
            <Link
              href={`/checkin/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Open scanner
            </Link>
          </div>
          {checkins.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No check-ins yet"
              description="Assigned ushers can scan invitation QR codes at each checkpoint."
            />
          ) : (
            <CheckinTable checkins={checkins} />
          )}
        </div>
      )}

      {tab === "ushers" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading font-semibold">Sub-users (ushers)</h3>
              <p className="text-sm text-muted-foreground">
                Authorised devices for guest verification.
              </p>
            </div>
            <button
              onClick={() => setUsherOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add usher
            </button>
          </div>
          {ushers.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No ushers assigned"
              description="Add ushers, security or reception staff to verify guests at checkpoints."
            />
          ) : (
            <UsherTable ushers={ushers} />
          )}
        </div>
      )}

      {/* Dialogs */}
      <GuestDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        guest={editGuest}
        onSave={onSaveGuest}
      />
      <ContributionDialog
        open={contribOpen}
        onOpenChange={setContribOpen}
        guests={guests}
        onSave={onSaveContribution}
      />
      <UsherDialog
        open={usherOpen}
        onOpenChange={setUsherOpen}
        onSave={onSaveUsher}
      />

      {/* Send dialog */}
      {sendOpen && (
        <Modal onClose={() => setSendOpen(false)} title="Send invitation cards">
          <p className="text-sm text-muted-foreground mb-4">
            Choose a dispatch channel. Draft invitations will be sent with their
            unique QR code and ID.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {INVITATION_CHANNEL_OPTIONS.map((channel) => (
              <button
                key={channel.value}
                className="min-h-10 px-4 py-2 inline-flex flex-col items-start justify-center rounded-md border border-border hover:bg-muted"
                onClick={() => onSend(channel.value)}
              >
                <span className="inline-flex items-center"><Send className="w-4 h-4 mr-2" />Send via {channel.label}</span>
                <span className="ml-6 text-xs text-muted-foreground text-left">{channel.description}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Preview dialog */}
      {previewInv && (
        <Modal
          onClose={() => setPreviewInv(null)}
          title="Invitation card"
          maxWidth="max-w-sm"
        >
          <InvitationCardPreview
            event={event}
            guest={{
              full_name: previewInv.guest_name,
              phone: previewInv.guest_phone,
            }}
            template={tplMap[previewInv.template_id] || allTemplates()[0]}
            invitation={previewInv}
            code={previewInv.invitation_code}
          />
          <div className="flex justify-end mt-4">
            <a
              href={`https://wa.me/${(previewInv.guest_phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`You're invited to ${event.title}. Code: ${previewInv.invitation_code}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground"
            >
              Open in WhatsApp
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- small presentational helpers ---

function Modal({
  title,
  children,
  onClose,
  maxWidth,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative flex max-h-[calc(100dvh-24px)] w-full ${maxWidth || "max-w-lg"} flex-col overflow-hidden rounded-xl bg-card shadow-xl`}
      >
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}

const TONES: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-amber-800 dark:text-amber-300",
  emerald: "bg-emerald-500/10 text-emerald-600",
  violet: "bg-violet-500/10 text-violet-600",
  amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-600",
  muted: "bg-muted text-muted-foreground",
};


function RsvpStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className={`text-2xl font-heading font-semibold ${TONES[tone]}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted px-3 py-2">
      <div className="text-[0.65rem] font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 break-words text-xs font-semibold">{value}</div>
    </div>
  );
}

function GuestTable({
  guests,
  onEdit,
  onDelete,
}: {
  guests: Guest[];
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
}) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {guests.map((g) => (
          <div key={g.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold">
                  {g.full_name}
                </h4>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {g.phone || "No phone"} {g.email ? `· ${g.email}` : ""}
                </p>
              </div>
              <Badge status={normalizeRsvpStatus(g.rsvp_status)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <InfoChip label="Category" value={g.category || "—"} />
              <InfoChip label="Invitation" value={g.invitation_status || "—"} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
                onClick={() => onEdit(g)}
              >
                Edit
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
                onClick={() => onDelete(g)}
              >
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Invitation</th>
              <th className="p-3 font-medium">RSVP</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{g.full_name}</td>
                <td className="p-3 text-muted-foreground">{g.phone || "—"}</td>
                <td className="p-3 text-muted-foreground">{g.email || "—"}</td>
                <td className="p-3">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                    {g.category}
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs capitalize">
                    {g.invitation_status}
                  </span>
                </td>
                <td className="p-3">
                  <Badge status={normalizeRsvpStatus(g.rsvp_status)} />
                </td>
                <td className="p-3 text-right">
                  <button
                    className="min-h-11 rounded-md px-3 text-sm hover:bg-muted"
                    onClick={() => onEdit(g)}
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                    onClick={() => onDelete(g)}
                    aria-label={`Delete ${g.full_name}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InvitationTable({
  invitations,
  onPreview,
}: {
  invitations: Invitation[];
  onPreview: (i: Invitation) => void;
}) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {invitations.map((i) => (
          <div key={i.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold">
                  {i.guest_name}
                </h4>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {i.invitation_code}
                </p>
              </div>
              <Badge status={normalizeRsvpStatus(i.rsvp_status)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InfoChip label="Channel" value={i.channel || "—"} />
              <InfoChip label="Status" value={i.status || "—"} />
            </div>
            <button
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
              onClick={() => onPreview(i)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </button>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Guest</th>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Channel</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">RSVP</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((i) => (
              <tr key={i.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{i.guest_name}</td>
                <td className="p-3 font-mono text-xs">{i.invitation_code}</td>
                <td className="p-3">
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs">
                    {i.channel}
                  </span>
                </td>
                <td className="p-3">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs capitalize">
                    {i.status}
                  </span>
                </td>
                <td className="p-3">
                  <Badge status={normalizeRsvpStatus(i.rsvp_status)} />
                </td>
                <td className="p-3 text-right">
                  <button
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                    onClick={() => onPreview(i)}
                    aria-label={`Preview invitation for ${i.guest_name}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RsvpTable({
  guests,
  onSet,
}: {
  guests: Guest[];
  onSet: (g: Guest, s: string) => void;
}) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {guests.map((g) => (
          <div key={g.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold">
                  {g.full_name}
                </h4>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {g.phone || "No phone"}
                </p>
              </div>
              <Badge status={normalizeRsvpStatus(g.rsvp_status)} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Updated: {formatDateTime(g.rsvp_date)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                className="min-h-11 rounded-md border border-border px-2 text-sm font-semibold text-emerald-600 hover:bg-muted"
                onClick={() => onSet(g, "attending")}
              >
                Yes
              </button>
              <button
                className="min-h-11 rounded-md border border-border px-2 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:bg-muted"
                onClick={() => onSet(g, "maybe")}
              >
                Maybe
              </button>
              <button
                className="min-h-11 rounded-md border border-border px-2 text-sm font-semibold text-rose-600 hover:bg-muted"
                onClick={() => onSet(g, "not_attending")}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Guest</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">RSVP</th>
              <th className="p-3 font-medium">Updated</th>
              <th className="p-3 font-medium text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{g.full_name}</td>
                <td className="p-3 text-muted-foreground">{g.phone || "—"}</td>
                <td className="p-3">
                  <Badge status={normalizeRsvpStatus(g.rsvp_status)} />
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {formatDateTime(g.rsvp_date)}
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      className="min-h-11 rounded-md px-3 text-sm text-emerald-600 hover:bg-muted"
                      onClick={() => onSet(g, "attending")}
                    >
                      Yes
                    </button>
                    <button
                      className="min-h-11 rounded-md px-3 text-sm text-amber-800 dark:text-amber-300 hover:bg-muted"
                      onClick={() => onSet(g, "maybe")}
                    >
                      Maybe
                    </button>
                    <button
                      className="min-h-11 rounded-md px-3 text-sm text-rose-600 hover:bg-muted"
                      onClick={() => onSet(g, "not_attending")}
                    >
                      No
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ContributionTable({
  contributions,
}: {
  contributions: Contribution[];
}) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {contributions.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold">
                  {c.guest_name || "—"}
                </h4>
                <p className="mt-1 text-base font-semibold">
                  TSh {(c.amount || 0).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-xs capitalize ${c.status === "received" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                {c.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InfoChip label="Type" value={c.contribution_type || "—"} />
              <InfoChip label="Card" value={c.card_type || "—"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatDateTime(c.received_date)}
            </p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Guest</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Card</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{c.guest_name || "—"}</td>
                <td className="p-3 font-semibold">
                  TSh {(c.amount || 0).toLocaleString()}
                </td>
                <td className="p-3">
                  <span className="rounded-md border border-border px-2 py-0.5 text-xs">
                    {c.contribution_type}
                  </span>
                </td>
                <td className="p-3">{c.card_type}</td>
                <td className="p-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs capitalize ${c.status === "received" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {formatDateTime(c.received_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CheckinTable({ checkins }: { checkins: CheckIn[] }) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {checkins.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="break-words text-sm font-semibold">
                {c.guest_name}
              </h4>
              <span
                className={`rounded-md px-2 py-1 text-xs capitalize ${c.status === "checked_in" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}
              >
                {c.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InfoChip label="Checkpoint" value={c.checkpoint || "—"} />
              <InfoChip label="Usher" value={c.usher_name || "—"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatDateTime(c.timestamp)}
            </p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Guest</th>
              <th className="p-3 font-medium">Checkpoint</th>
              <th className="p-3 font-medium">Usher</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {checkins.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{c.guest_name}</td>
                <td className="p-3">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                    {c.checkpoint}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {c.usher_name || "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs capitalize ${c.status === "checked_in" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {formatDateTime(c.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UsherTable({ ushers }: { ushers: Usher[] }) {
  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {ushers.map((u) => (
          <div key={u.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold">
                  {u.usher_name}
                </h4>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {u.usher_phone || u.usher_email || "No contact"}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-xs capitalize ${u.status === "active" ? "bg-primary text-primary-foreground" : "border border-border"}`}
              >
                {u.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(u.checkpoints || []).map((cp) => (
                <span
                  key={cp}
                  className="rounded-md bg-secondary px-2 py-1 text-[0.65rem]"
                >
                  {cp}
                </span>
              ))}
            </div>
            <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
              Access: {u.access_code}
            </p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Checkpoints</th>
              <th className="p-3 font-medium">Access code</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ushers.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{u.usher_name}</td>
                <td className="p-3 text-muted-foreground">
                  {u.usher_phone || u.usher_email || "—"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(u.checkpoints || []).map((cp) => (
                      <span
                        key={cp}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[0.6rem]"
                      >
                        {cp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{u.access_code}</td>
                <td className="p-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs capitalize ${u.status === "active" ? "bg-primary text-primary-foreground" : "border border-border"}`}
                  >
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
