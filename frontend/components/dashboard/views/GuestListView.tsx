import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createGuest,
  createGuests,
  deleteGuest,
  getGuests,
  logAction,
  updateGuest,
  type Guest,
} from "@/lib/data";
import { MAX_EVENT_GUESTS, parseGuestImportFile, prepareGuestImport } from "@/lib/guest-import";
import GuestDialog from "@/components/GuestDialog";
import type { Event as DashboardEvent } from "../types";
import { useIsMobile } from "../hooks";
import { Badge, SectionHeader } from "../ui";
import { Loader2, Plus, Search, Trash2, Upload } from "lucide-react";

function normalizeRsvpStatus(
  status?: string,
): "Pending" | "Accepted" | "Declined" {
  switch (status?.toLowerCase()) {
    case "accepted":
    case "attending":
      return "Accepted";

    case "declined":
    case "not_attending":
      return "Declined";

    default:
      return "Pending";
  }
}

export function GuestListView({
  events,
  initialEventId,
}: {
  events: DashboardEvent[];
  initialEventId?: string | null;
}) {
  const isMobile = useIsMobile();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedEventId, setSelectedEventId] = useState(
    initialEventId && events.some((event) => event.id === initialEventId)
      ? initialEventId
      : events[0]?.id ?? "",
  );
  const [guests, setGuests] = useState<Guest[]>([]);
  const selectedEventIdRef = useRef(selectedEventId);
  const previousInitialEventId = useRef(initialEventId);
  const loadVersion = useRef(0);
  const mounted = useRef(true);
  const importInFlight = useRef(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importMessageIsError, setImportMessageIsError] = useState(false);

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const selectEvent = useCallback((eventId: string) => {
    selectedEventIdRef.current = eventId;
    loadVersion.current += 1;
    setSelectedEventId(eventId);
    setGuests([]);
    setLoadingGuests(Boolean(eventId));
    setGuestError(null);
    setImportMessage("");
    setImportMessageIsError(false);
    setDialogOpen(false);
    setEditGuest(null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const requestedEventChanged = previousInitialEventId.current !== initialEventId;
      previousInitialEventId.current = initialEventId;
      if (requestedEventChanged && initialEventId && events.some((event) => event.id === initialEventId)) {
        selectEvent(initialEventId);
        return;
      }
      if (events.some((event) => event.id === selectedEventIdRef.current)) return;
      selectEvent(events.find((event) => event.id === initialEventId)?.id ?? events[0]?.id ?? "");
    });
  }, [events, initialEventId, selectEvent]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; loadVersion.current += 1; };
  }, []);

  const loadGuests = useCallback(async (eventId = selectedEventId) => {
    if (!mounted.current || selectedEventIdRef.current !== eventId) return;
    const version = ++loadVersion.current;
    if (!eventId) {
      setGuests([]);
      setLoadingGuests(false);
      return;
    }

    try {
      setLoadingGuests(true);
      setGuestError(null);
      const nextGuests = await getGuests(eventId);
      if (!mounted.current || version !== loadVersion.current || selectedEventIdRef.current !== eventId) return;
      setGuests(nextGuests);
    } catch (error) {
      if (!mounted.current || version !== loadVersion.current || selectedEventIdRef.current !== eventId) return;
      setGuestError(
        error instanceof Error ? error.message : "Unable to load guests.",
      );
    } finally {
      if (mounted.current && version === loadVersion.current && selectedEventIdRef.current === eventId) setLoadingGuests(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    queueMicrotask(() => { void loadGuests(); });
    return () => { loadVersion.current += 1; };
  }, [loadGuests]);

  const filteredGuests = useMemo(() => {
    const text = query.trim().toLowerCase();

    return guests.filter((guest) => {
      const matchesSearch =
        !text ||
        guest.full_name.toLowerCase().includes(text) ||
        guest.phone?.includes(text) ||
        guest.email?.toLowerCase().includes(text);
      const matchesFilter =
        filter === "all" ||
        guest.category === filter ||
        guest.rsvp_status === filter ||
        guest.invitation_status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, guests, query]);

  const saveGuest = async (form: Partial<Guest>) => {
    if (!selectedEventId) return;

    if (editGuest) {
      await updateGuest(selectedEventId, editGuest.id, form);
    } else {
      if (guests.length >= MAX_EVENT_GUESTS) {
        throw new Error(`This event already has ${MAX_EVENT_GUESTS} guests. Remove a guest before adding another.`);
      }
      await createGuest(selectedEventId, form);
    }

    setDialogOpen(false);
    setEditGuest(null);
    loadGuests();
  };

  const removeGuest = async (guest: Guest) => {
    if (!selectedEventId || !confirm(`Remove ${guest.full_name}?`)) return;

    await deleteGuest(selectedEventId, guest.id);
    loadGuests();
  };

  const importGuests = async (file: File | null) => {
    if (!file || !selectedEventId || importInFlight.current) return;
    const eventId = selectedEventId;
    const importInput = importInputRef.current;
    importInFlight.current = true;

    setImporting(true);
    setImportMessage("");
    setImportMessageIsError(false);

    try {
      const importedGuests = await parseGuestImportFile(file);

      if (importedGuests.length === 0) {
        throw new Error("No guest rows found. Include at least a Full Name column.");
      }

      const existingGuests = await getGuests(eventId);
      if (mounted.current && selectedEventIdRef.current === eventId) setGuests(existingGuests);
      const prepared = prepareGuestImport(importedGuests, existingGuests);

      if (prepared.guests.length === 0) {
        if (mounted.current && selectedEventIdRef.current === eventId) {
          setImportMessage(`All guests in this file are already in the list. Skipped ${prepared.skipped_count} duplicate guests.`);
        }
        return;
      }

      const created = await createGuests(eventId, prepared.guests);

      if (mounted.current && selectedEventIdRef.current === eventId) {
        setGuests([...existingGuests, ...created]);
        setImportMessage(
          `Imported ${created.length} guests from ${file.name}.` +
            (prepared.skipped_count ? ` Skipped ${prepared.skipped_count} duplicate guests.` : ""),
        );
        void loadGuests(eventId);
      }

      void logAction({
        action: "guest.import",
        entityType: "Event",
        entityId: eventId,
        details: `Imported ${created.length} guests from ${file.name}`,
      }).catch(() => {});
    } catch (error) {
      if (mounted.current && selectedEventIdRef.current === eventId) {
        setImportMessageIsError(true);
        setImportMessage(error instanceof Error ? error.message : "Could not import guests.");
      }
    } finally {
      importInFlight.current = false;
      if (mounted.current) setImporting(false);

      if (importInput) importInput.value = "";
    }
  };

  return (
    <div>
      <SectionHeader
        title="Guest List"
        action={
          <button
            className="btn-gold"
            disabled={!selectedEventId || loadingGuests || importing || guests.length >= MAX_EVENT_GUESTS}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 14,
              opacity: selectedEventId && !loadingGuests && !importing && guests.length < MAX_EVENT_GUESTS ? 1 : 0.55,
            }}
            onClick={() => {
              setEditGuest(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} style={{ display: "inline", marginRight: 6 }} />
            Add Guest
          </button>
        }
      />

      <div
        className="card-base"
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 320px) 1fr",
          gap: 12,
          alignItems: "end",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>
            Event
          </span>
          <select
            value={selectedEventId}
            onChange={(event) => selectEvent(event.target.value)}
            style={{
              height: 38,
              borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.22)",
              background: "var(--card)",
              color: "var(--foreground)",
              padding: "0 10px",
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>

        <div
          style={{
            color: "var(--muted-foreground)",
            fontSize: 13,
            display: "flex",
            justifyContent: isMobile ? "flex-start" : "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            {selectedEvent
              ? `${selectedEvent.category} · ${selectedEvent.date}`
              : "Select an event to manage its guests."}
          </span>
          {selectedEvent && (
            <Link
              href={`/events/${selectedEvent.id}?tab=guests`}
              style={{ color: "var(--accent-text)", fontWeight: 700 }}
            >
              Open full event
            </Link>
          )}
        </div>
      </div>

      <div className="card-base" style={{ padding: 16, marginBottom: 16 }}>
        <p style={{ color: "var(--foreground)", fontSize: 14, fontWeight: 600, margin: 0 }}>
          {loadingGuests ? "Loading guest count…" : `${guests.length} / ${MAX_EVENT_GUESTS} guests`}
        </p>
        <p style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.6, margin: "6px 0 0" }}>
          Each event supports up to {MAX_EVENT_GUESTS} guests and {MAX_EVENT_GUESTS} personalised cards. Import skips duplicates and must fit the remaining spaces. You can still edit existing guests when the limit is reached.
        </p>
      </div>

      <div className="card-base" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(201,168,76,0.14)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "none" : 340 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-foreground)",
              }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guests..."
              style={{
                width: "100%",
                height: 38,
                borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.22)",
                background: "transparent",
                color: "var(--foreground)",
                padding: "0 12px 0 36px",
              }}
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={{
              height: 38,
              borderRadius: 8,
              border: "1px solid rgba(201,168,76,0.22)",
              background: "var(--card)",
              color: "var(--foreground)",
              padding: "0 10px",
            }}
          >
            <option value="all">All guests</option>
            <option value="Single">Single</option>
            <option value="Double/Couple">Double/Couple</option>
            <option value="VIP">VIP</option>
            <option value="attending">Attending</option>
            <option value="pending">RSVP pending</option>
            <option value="not_sent">Not yet invited</option>
          </select>

          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(event) => importGuests(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="btn-outline"
            disabled={!selectedEventId || importing}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              fontSize: 13,
              opacity: !selectedEventId || importing ? 0.55 : 1,
            }}
            onClick={() => importInputRef.current?.click()}
          >
            {importing ? (
              <Loader2 size={16} style={{ display: "inline", marginRight: 6 }} />
            ) : (
              <Upload size={16} style={{ display: "inline", marginRight: 6 }} />
            )}
            Import
          </button>
        </div>

        {importMessage && (
          <div
            role={importMessageIsError ? "alert" : "status"}
            style={{
              margin: "14px 16px 0",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: 8,
              padding: "10px 12px",
              color: importMessageIsError ? "var(--destructive)" : "var(--muted-foreground)",
              fontSize: 13,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {importMessage}
          </div>
        )}

        {guestError && (
          <div role="alert" style={{ padding: 16, color: "var(--destructive)", fontSize: 14 }}>
            {guestError}
          </div>
        )}

        {loadingGuests ? (
          <div style={{ padding: 32, color: "var(--accent-text)", textAlign: "center" }}>
            <Loader2 size={22} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            Loading guests...
          </div>
        ) : filteredGuests.length === 0 ? (
          <div style={{ padding: 32, color: "var(--muted-foreground)", textAlign: "center" }}>
            {selectedEventId
              ? "No guests found for this event."
              : "Create an event first, then add guests here."}
          </div>
        ) : isMobile ? (
          <div
            style={{
              display: "grid",
              gap: 12,
              padding: 12,
            }}
          >
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 14,
                  background: "var(--card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "var(--foreground)",
                        fontWeight: 700,
                        fontSize: 14,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {guest.full_name}
                    </div>
                    <div
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: 12,
                        marginTop: 4,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {guest.phone || "No phone"}
                      {guest.email ? ` · ${guest.email}` : ""}
                    </div>
                  </div>
                  <Badge status={normalizeRsvpStatus(guest.rsvp_status)} />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <span className="badge">{guest.category || "Single"}</span>
                  <span
                    className="badge"
                    style={{
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                      textTransform: "capitalize",
                    }}
                  >
                    {guest.invitation_status || "not_sent"}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ minHeight: 44, borderRadius: 8 }}
                    onClick={() => {
                      setEditGuest(guest);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{
                      minHeight: 44,
                      borderRadius: 8,
                      color: "var(--destructive)",
                    }}
                    onClick={() => removeGuest(guest)}
                    aria-label={`Delete ${guest.full_name}`}
                  >
                    <Trash2 size={16} style={{ display: "inline", marginRight: 6 }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(201,168,76,0.14)",
                    color: "var(--muted-foreground)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: 12, fontWeight: 600 }}>Full Name</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Phone</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Email</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Category</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>Invitation</th>
                  <th style={{ padding: 12, fontWeight: 600 }}>RSVP</th>
                  <th style={{ padding: 12, fontWeight: 600, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}
                  >
                    <td style={{ padding: 12, color: "var(--foreground)", fontWeight: 600 }}>
                      {guest.full_name}
                    </td>
                    <td style={{ padding: 12, color: "var(--muted-foreground)" }}>
                      {guest.phone || "-"}
                    </td>
                    <td style={{ padding: 12, color: "var(--muted-foreground)" }}>
                      {guest.email || "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span className="badge">{guest.category || "Single"}</span>
                    </td>
                    <td style={{ padding: 12, color: "var(--muted-foreground)", textTransform: "capitalize" }}>
                      {guest.invitation_status || "not_sent"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <Badge status={normalizeRsvpStatus(guest.rsvp_status)} />
                    </td>
                    <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        style={{
                          height: 32,
                          minHeight: 44,
                          padding: "0 10px",
                          borderRadius: 8,
                          color: "var(--accent-text)",
                        }}
                        onClick={() => {
                          setEditGuest(guest);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ff6b6b",
                        }}
                        onClick={() => removeGuest(guest)}
                        aria-label={`Delete ${guest.full_name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guest={editGuest}
        onSave={saveGuest}
      />
    </div>
  );
}
