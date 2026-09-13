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
export const DISPATCH_CHANNELS = ["WhatsApp", "SMS", "Email"];

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
