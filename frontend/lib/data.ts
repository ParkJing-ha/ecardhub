// Thin data-access layer. Replace the stubs with your real database queries
// (Prisma, Drizzle, direct SQL, an ORM, or fetch to your API). Keeping the
// shape stable means the components don't change when you wire the DB.

import { allTemplates, generateCode, type Template } from "./templates";

export interface Event {
  id: string;
  title: string;
  event_type: string;
  category: string;
  host_family_name: string;
  host_name?: string;
  event_date: string;
  event_time: string | null;
  venue: string;
  description: string;
  status: string;
  package?: string;
  card_message: string;
  rsvp_deadline: string | null;
  rsvp_reply_phone: string;
  rsvp_phone?: string;
  contribution_target?: number;
  dress_code_colors: string[];
  _tplMap?: Record<string, Template>;
}

export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  category?: string;
  notes?: string;
  invitation_status?: string;
  rsvp_status?: string;
  rsvp_date?: string | null;
}

export interface Invitation {
  id: string;
  event_id: string;
  guest_id: string;
  guest_name: string;
  guest_phone?: string;
  invitation_code: string;
  qr_data: string;
  template_id: string;
  channel: string;
  package: string;
  status: string;
  rsvp_status: string;
  customized_text?: string;
}

type ApiGuest = Omit<Guest, "event_id"> & { event?: string | number };
type ApiInvitation = Omit<Invitation, "event_id" | "guest_id"> & {
  event?: string | number;
  guest?: string | number;
  guest_id?: string | number;
};
type ApiContribution = Omit<Contribution, "event_id" | "guest_id" | "amount"> & {
  event?: string | number;
  guest?: string | number;
  guest_id?: string | number;
  amount: string | number;
};
type ApiCheckIn = Omit<CheckIn, "event_id"> & {
  event?: string | number;
};
type ApiUsher = Omit<Usher, "event_id"> & {
  event?: string | number;
};
type ApiNotificationLog = Omit<
  NotificationLog,
  "event_id" | "guest_id" | "invitation_id"
> & {
  event?: string | number;
  guest?: string | number;
  invitation?: string | number;
};

function appApiUrl(path: string): string {
  if (typeof window !== "undefined") return path;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://127.0.0.1:3000";

  return `${baseUrl}${path}`;
}

function appFetch(path: string, options: RequestInit = {}) {
  return fetch(appApiUrl(path), options);
}

async function readJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      [data?.error, data?.detail].filter(Boolean).join(" ") ||
      Object.values(data ?? {}).flat().join(" ") ||
      fallbackMessage;
    throw new Error(String(message));
  }

  return data as T;
}

const eventTypeLabels: Record<string, string> = {
  wedding: "Wedding",
  graduation: "Graduation",
  birthday: "Birthday",
  kitchen_party: "Kitchen Party",
  holiday: "Holiday",
  anniversary: "Anniversary",
  send_off: "Send-off",
  custom_ceremony: "Custom Ceremony",
};

function normalizeEvent(event: Event): Event {
  return {
    ...event,
    id: String(event.id),
    category: event.category ?? eventTypeLabels[event.event_type] ?? "Custom Ceremony",
    host_name: event.host_name ?? event.host_family_name,
    rsvp_phone: event.rsvp_phone ?? event.rsvp_reply_phone,
    package: event.package ?? "Standard",
    contribution_target: event.contribution_target ?? 0,
  };
}

function normalizeGuest(guest: ApiGuest, eventId: string): Guest {
  return {
    ...guest,
    id: String(guest.id),
    event_id: String(guest.event ?? eventId),
  };
}

function normalizeInvitation(
  invitation: ApiInvitation,
  eventId: string,
): Invitation {
  return {
    ...invitation,
    id: String(invitation.id),
    event_id: String(invitation.event ?? eventId),
    guest_id: String(invitation.guest_id ?? invitation.guest ?? ""),
  };
}

function normalizeContribution(
  contribution: ApiContribution,
  eventId: string,
): Contribution {
  return {
    ...contribution,
    id: String(contribution.id),
    event_id: String(contribution.event ?? eventId),
    guest_id: contribution.guest_id
      ? String(contribution.guest_id)
      : contribution.guest
        ? String(contribution.guest)
        : undefined,
    amount: Number(contribution.amount),
  };
}

function normalizeCheckIn(checkin: ApiCheckIn, eventId: string): CheckIn {
  return {
    ...checkin,
    id: String(checkin.id),
    event_id: String(checkin.event ?? eventId),
  };
}

function normalizeUsher(usher: ApiUsher, eventId: string): Usher {
  return {
    ...usher,
    id: String(usher.id),
    event_id: String(usher.event ?? eventId),
  };
}

function normalizeNotificationLog(
  log: ApiNotificationLog,
  eventId: string,
): NotificationLog {
  return {
    ...log,
    id: String(log.id),
    event_id: String(log.event ?? eventId),
    guest_id: String(log.guest ?? ""),
    invitation_id: String(log.invitation ?? ""),
  };
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const response = await appFetch(`/api/events/${eventId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch event.");
  }

  const event = (await response.json()) as Event;
  return normalizeEvent(event);
}

export async function getEvents(): Promise<Event[]> {
  const response = await appFetch("/api/events", {
    method: "GET",
    cache: "no-store",
  });
  const events = await readJsonResponse<Event[]>(
    response,
    "Failed to fetch events.",
  );
  return events.map(normalizeEvent);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const response = await appFetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    await readJsonResponse(response, "Failed to delete event.");
  }
}

export async function getGuests(eventId: string): Promise<Guest[]> {
  const response = await appFetch(`/api/events/${eventId}/guests`, {
    method: "GET",
    cache: "no-store",
  });
  const guests = await readJsonResponse<ApiGuest[]>(
    response,
    "Failed to fetch guests.",
  );
  return guests.map((guest) => normalizeGuest(guest, eventId));
}

export async function getTemplates(eventId?: string): Promise<Template[]> {
  const path = eventId ? `/api/events/${eventId}/templates` : "/api/templates";
  const response = await appFetch(path, {
    method: "GET",
    cache: "no-store",
  });
  return readJsonResponse<Template[]>(response, "Failed to fetch templates.");
}

export async function getInvitations(eventId: string): Promise<Invitation[]> {
  const response = await appFetch(`/api/events/${eventId}/invitations`, {
    method: "GET",
    cache: "no-store",
  });
  const invitations = await readJsonResponse<ApiInvitation[]>(
    response,
    "Failed to fetch invitations.",
  );
  return invitations.map((invitation) =>
    normalizeInvitation(invitation, eventId),
  );
}

export async function createGuest(
  eventId: string,
  data: Partial<Guest>,
): Promise<Guest> {
  const response = await appFetch(`/api/events/${eventId}/guests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const guest = await readJsonResponse<ApiGuest>(
    response,
    "Failed to create guest.",
  );
  return normalizeGuest(guest, eventId);
}

export async function createGuests(
  eventId: string,
  records: Partial<Guest>[],
): Promise<Guest[]> {
  const response = await appFetch(`/api/events/${eventId}/guests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records),
  });
  const guests = await readJsonResponse<ApiGuest[]>(
    response,
    "Failed to import guests.",
  );
  return guests.map((guest) => normalizeGuest(guest, eventId));
}

export async function deleteGuest(eventId: string, id: string): Promise<void> {
  const response = await appFetch(`/api/events/${eventId}/guests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    await readJsonResponse(response, "Failed to delete guest.");
  }
}

export interface CreateInvitationInput {
  event_id: string;
  guest_id: string;
  guest_name: string;
  guest_phone?: string;
  template_id: string;
  channel: string;
  package: string;
  customized_text?: string;
}

/** Generate one invitation record per guest who doesn't already have one. */
export async function generateInvitations(
  eventId: string,
  guests: Guest[],
  existing: Invitation[],
  input: Omit<CreateInvitationInput, "guest_id" | "guest_name" | "guest_phone">,
): Promise<Invitation[]> {
  const have = new Set(existing.map((i) => i.guest_id));
  const toCreate = guests.filter((g) => !have.has(g.id));

  const records = toCreate.map((g) => {
    const code = generateCode("INV");
    return {
      guest_id: g.id,
      guest_name: g.full_name,
      guest_phone: g.phone,
      invitation_code: code,
      qr_data: code,
      template_id: input.template_id,
      channel: input.channel,
      package: input.package,
      status: "draft",
      rsvp_status: "pending",
      customized_text: input.customized_text,
    };
  });

  if (records.length === 0) {
    return [];
  }

  const response = await appFetch(`/api/events/${eventId}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records),
  });
  const invitations = await readJsonResponse<ApiInvitation[]>(
    response,
    "Failed to generate invitations.",
  );
  return invitations.map((invitation) =>
    normalizeInvitation(invitation, eventId),
  );
}

/** Load everything an event detail page needs in one round-trip. */
export async function loadEventDetail(eventId: string): Promise<{
  event: Event | null;
  guests: Guest[];
  invitations: Invitation[];
  contributions: Contribution[];
  checkins: CheckIn[];
  ushers: Usher[];
  tplMap: Record<string, Template>;
}> {
  const event = await getEvent(eventId);

  if (!event) {
    return {
      event: null,
      guests: [],
      invitations: [],
      contributions: [],
      checkins: [],
      ushers: [],
      tplMap: {},
    };
  }

  const [
    guests,
    invitations,
    contributions,
    checkins,
    ushers,
    templates,
  ] = await Promise.all([
    getGuests(eventId).catch(() => []),
    getInvitations(eventId).catch(() => []),
    getContributions(eventId).catch(() => []),
    getCheckins(eventId).catch(() => []),
    getUshers(eventId).catch(() => []),
    getTemplates(eventId).catch(() => []),
  ]);
  const tplMap: Record<string, Template> = {};
  allTemplates(templates).forEach((t) => (tplMap[t.id] = t));
  if (event) event._tplMap = tplMap;
  return {
    event,
    guests,
    invitations,
    contributions,
    checkins,
    ushers,
    tplMap,
  };
}

//vitu vingapi ambavyo havipo

export interface Contribution {
  id: string;
  event_id: string;
  guest_id?: string;
  guest_name?: string;
  amount: number;
  contribution_type: string;
  card_type: string;
  status: string;
  reference?: string;
  received_date?: string;
  notes?: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  guest_name: string;
  checkpoint: string;
  usher_name?: string;
  status: string;
  timestamp: string;
}

export interface Usher {
  id: string;
  event_id: string;
  usher_name: string;
  usher_email?: string;
  usher_phone?: string;
  checkpoints: string[];
  access_code: string;
  status: string;
}

export interface NotificationLog {
  id: string;
  invitation_id: string;
  event_id: string;
  guest_id: string;
  channel: string;
  status: string;
  recipient: string;
  message: string;
  created_at?: string;
}

export interface WalletTransaction {
  id: string;
  event?: string | number | null;
  direction: "credit" | "debit";
  amount: number;
  provider?: string;
  gateway_reference?: string;
  status: string;
  description?: string;
  created_at: string;
}

export async function getContributions(
  eventId: string,
): Promise<Contribution[]> {
  const response = await appFetch(`/api/events/${eventId}/contributions`, {
    method: "GET",
    cache: "no-store",
  });
  const contributions = await readJsonResponse<ApiContribution[]>(
    response,
    "Failed to fetch contributions.",
  );
  return contributions.map((contribution) =>
    normalizeContribution(contribution, eventId),
  );
}

export async function getCheckins(eventId: string): Promise<CheckIn[]> {
  const response = await appFetch(`/api/events/${eventId}/checkins`, {
    method: "GET",
    cache: "no-store",
  });
  const checkins = await readJsonResponse<ApiCheckIn[]>(
    response,
    "Failed to fetch check-ins.",
  );
  return checkins.map((checkin) => normalizeCheckIn(checkin, eventId));
}

export async function getUshers(eventId: string): Promise<Usher[]> {
  const response = await appFetch(`/api/events/${eventId}/ushers`, {
    method: "GET",
    cache: "no-store",
  });
  const ushers = await readJsonResponse<ApiUsher[]>(
    response,
    "Failed to fetch ushers.",
  );
  return ushers.map((usher) => normalizeUsher(usher, eventId));
}

export async function getNotificationLogs(
  eventId: string,
): Promise<NotificationLog[]> {
  const response = await appFetch(`/api/events/${eventId}/notifications`, {
    method: "GET",
    cache: "no-store",
  });
  const logs = await readJsonResponse<ApiNotificationLog[]>(
    response,
    "Failed to fetch notification logs.",
  );
  return logs.map((log) => normalizeNotificationLog(log, eventId));
}

/** Load everything an event detail page needs in one round-trip. */

// --- Guest CRUD -----------------------------------------------------------

export async function updateGuest(
  eventId: string,
  id: string,
  data: Partial<Guest>,
): Promise<Guest> {
  const response = await appFetch(`/api/events/${eventId}/guests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const guest = await readJsonResponse<ApiGuest>(
    response,
    "Failed to update guest.",
  );
  return normalizeGuest(guest, eventId);
}

export async function createCustomTemplate(
  eventId: string,
  data: Partial<Template>,
): Promise<Template> {
  const payload = {
    name: data.name || "Selected invitation template",
    category: data.category || "Custom Ceremony",
    style: data.style || "Custom",
    primary_color: data.primary_color || "#7A2E45",
    accent_color: data.accent_color || "#C9A24B",
    background_color: data.background_color || "#FBF7F0",
    text_color: data.text_color || "#2A1A2E",
    font_family: data.font_family || "Playfair Display",
    layout: data.layout || "centered",
    image_data_url: data.image_data_url || "",
    description: data.description || "",
  };

  const response = await appFetch(`/api/events/${eventId}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJsonResponse<Template>(response, "Failed to save template.");
}

// --- Invitations ----------------------------------------------------------

export async function sendInvitations(
  eventId: string,
  invitations: Invitation[],
  channel: string,
): Promise<void> {
  if (invitations.length === 0) return;

  const response = await appFetch(`/api/events/${eventId}/invitations/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitation_ids: invitations.map((invitation) => invitation.id),
      channel,
    }),
  });

  await readJsonResponse(response, "Failed to send invitations.");
}

// --- RSVP -----------------------------------------------------------------

export async function setRsvp(
  eventId: string,
  guest: Guest,
  status: string,
): Promise<void> {
  await updateGuest(eventId, guest.id, {
    rsvp_status: status,
    rsvp_date: new Date().toISOString(),
  });
}

// --- Contributions --------------------------------------------------------

export async function saveContribution(
  eventId: string,
  form: {
    guest_id?: string;
    amount: number;
    contribution_type: string;
    card_type: string;
    status?: string;
    reference?: string;
    notes?: string;
  },
  guestName: string,
): Promise<Contribution> {
  const payload = {
    guest_id: form.guest_id,
    guest_name: guestName,
    amount: form.amount,
    contribution_type: form.contribution_type,
    card_type: form.card_type,
    status: form.status || "received",
    reference: form.reference || generateCode("CNTR"),
    notes: form.notes,
  };
  const response = await appFetch(`/api/events/${eventId}/contributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const contribution = await readJsonResponse<ApiContribution>(
    response,
    "Failed to save contribution.",
  );
  return normalizeContribution(contribution, eventId);
}

// --- Ushers ---------------------------------------------------------------

export async function saveUsher(
  eventId: string,
  form: {
    usher_name: string;
    usher_email?: string;
    usher_phone?: string;
    checkpoints: string[];
  },
): Promise<Usher> {
  const response = await appFetch(`/api/events/${eventId}/ushers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const usher = await readJsonResponse<ApiUsher>(
    response,
    "Failed to save usher.",
  );
  return normalizeUsher(usher, eventId);
}

export async function createCheckIn(
  eventId: string,
  input: {
    invitation_id: string;
    usher_id?: string;
    checkpoint: string;
    device_id?: string;
  },
): Promise<CheckIn> {
  const response = await appFetch(`/api/events/${eventId}/checkins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const checkin = await readJsonResponse<ApiCheckIn>(
    response,
    "Failed to record check-in.",
  );
  return normalizeCheckIn(checkin, eventId);
}

// --- Audit (best-effort) --------------------------------------------------

export async function logAction(input: {
  user?: { id?: string; full_name?: string; email?: string };
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  severity?: string;
}): Promise<void> {
  try {
    await appFetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        details: input.details ?? "",
        severity: input.severity ?? "info",
      }),
    });
  } catch {
    /* best-effort */
  }
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const response = await appFetch("/api/wallet/transactions", {
    method: "GET",
    cache: "no-store",
  });
  const transactions = await readJsonResponse<
    (Omit<WalletTransaction, "amount"> & { amount: string | number })[]
  >(response, "Failed to fetch wallet transactions.");

  return transactions.map((transaction) => ({
    ...transaction,
    id: String(transaction.id),
    amount: Number(transaction.amount),
  }));
}

export async function createWalletTopup(input: {
  amount: number;
  provider: string;
}): Promise<WalletTransaction> {
  const response = await appFetch("/api/wallet/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      direction: "credit",
      amount: input.amount,
      provider: input.provider,
      status: "pending",
      description: `Wallet top-up via ${input.provider}`,
    }),
  });
  const transaction = await readJsonResponse<
    Omit<WalletTransaction, "amount"> & { amount: string | number }
  >(response, "Failed to create wallet top-up.");

  return {
    ...transaction,
    id: String(transaction.id),
    amount: Number(transaction.amount),
  };
}
