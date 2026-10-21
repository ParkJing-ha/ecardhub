// Shared constants + helpers used across the event pages.
// Template-related constants live in ./templates.ts.

export const CHECKPOINTS = ["Entrance", "Food", "Drinks", "VIP Area"];
export const GUEST_CATEGORIES = ["Single", "Double/Couple", "VIP"];
export const PAYMENT_METHODS = [
  "M-Pesa",
  "Airtel Money",
  "Mixx by Yas",
  "Card",
];
export const INVITATION_CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS", description: "Send the event text details by normal SMS only." },
  { value: "sms_whatsapp", label: "SMS + WhatsApp", description: "Send the invitation card and event information on WhatsApp, plus the event text details by normal SMS." },
  { value: "whatsapp", label: "WhatsApp only", description: "Send the invitation card, template, and event information on WhatsApp only." },
  { value: "email", label: "Email", description: "Send the invitation by email only." },
  { value: "sms_whatsapp_email", label: "SMS + WhatsApp + Email", description: "Send through all channels: invitation card and event information on WhatsApp, event text details by SMS, and an email invitation." },
] as const;

export const DISPATCH_CHANNELS = INVITATION_CHANNEL_OPTIONS.map(({ label }) => label);

export function formatDate(
  value?: string | null,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(
      "en-GB",
      opts || { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
