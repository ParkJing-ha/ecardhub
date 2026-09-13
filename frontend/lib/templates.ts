// Template data model + presets for the invitation card builder.
// Pure data — safe to import from both server and client components.

export type TemplateCategory =
  | "Wedding"
  | "Graduation"
  | "Birthday"
  | "Kitchen Party"
  | "Holiday"
  | "Anniversary"
  | "Send-off"
  | "Custom Ceremony"
  | "All";

export type TemplateStyle =
  | "Elegant"
  | "Modern"
  | "Floral"
  | "Minimal"
  | "Classic"
  | "Bold"
  | "Custom";

export type TemplateLayout = "centered" | "split" | "frame" | "minimal";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  style: TemplateStyle;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  layout: TemplateLayout;
  thumbnail?: string;
  image_data_url?: string;
  is_premium: boolean;
  is_custom: boolean;
  description?: string;
}

export const EVENT_CATEGORIES: TemplateCategory[] = [
  "Wedding",
  "Graduation",
  "Birthday",
  "Kitchen Party",
  "Holiday",
  "Anniversary",
  "Send-off",
  "Custom Ceremony",
];

export const FONTS = ["Playfair Display", "Cormorant Garamond", "Inter"];
export const LAYOUTS: TemplateLayout[] = [
  "centered",
  "split",
  "frame",
  "minimal",
];

export const PRESET_TEMPLATES: Omit<Template, "id" | "is_custom">[] = [
  {
    name: "Royal Bloom",
    category: "Wedding",
    style: "Elegant",
    primary_color: "#7A2E45",
    accent_color: "#C9A24B",
    background_color: "#FBF7F0",
    text_color: "#2A1A2E",
    font_family: "Playfair Display",
    layout: "centered",
    is_premium: false,
  },
  {
    name: "Gilded Frame",
    category: "Wedding",
    style: "Classic",
    primary_color: "#3E2C1D",
    accent_color: "#C9A24B",
    background_color: "#1E1612",
    text_color: "#F5EBD7",
    font_family: "Cormorant Garamond",
    layout: "frame",
    is_premium: true,
  },
  {
    name: "Garden Party",
    category: "Birthday",
    style: "Floral",
    primary_color: "#2F6B4F",
    accent_color: "#E8A33D",
    background_color: "#F2F7EE",
    text_color: "#1F3A2A",
    font_family: "Playfair Display",
    layout: "split",
    is_premium: false,
  },
  {
    name: "Midnight Gala",
    category: "Anniversary",
    style: "Modern",
    primary_color: "#1B2A4A",
    accent_color: "#D4AF37",
    background_color: "#0F1726",
    text_color: "#E8EEF7",
    font_family: "Inter",
    layout: "minimal",
    is_premium: true,
  },
  {
    name: "Soft Petal",
    category: "Kitchen Party",
    style: "Floral",
    primary_color: "#B5456B",
    accent_color: "#F2C9A0",
    background_color: "#FDF2F4",
    text_color: "#4A2230",
    font_family: "Cormorant Garamond",
    layout: "centered",
    is_premium: false,
  },
  {
    name: "Cap & Gown",
    category: "Graduation",
    style: "Classic",
    primary_color: "#1F3A5F",
    accent_color: "#C9A24B",
    background_color: "#F4F6FB",
    text_color: "#16223A",
    font_family: "Playfair Display",
    layout: "split",
    is_premium: false,
  },
  {
    name: "Tropic Sun",
    category: "Holiday",
    style: "Bold",
    primary_color: "#C2410C",
    accent_color: "#FACC15",
    background_color: "#FFF7E6",
    text_color: "#3A1A0A",
    font_family: "Inter",
    layout: "centered",
    is_premium: false,
  },
  {
    name: "Bon Voyage",
    category: "Send-off",
    style: "Minimal",
    primary_color: "#334155",
    accent_color: "#38BDF8",
    background_color: "#F8FAFC",
    text_color: "#0F172A",
    font_family: "Inter",
    layout: "minimal",
    is_premium: false,
  },
  {
    name: "Ivory Script",
    category: "Custom Ceremony",
    style: "Elegant",
    primary_color: "#5B3A29",
    accent_color: "#B08D57",
    background_color: "#FBF6EE",
    text_color: "#3A2A1F",
    font_family: "Cormorant Garamond",
    layout: "centered",
    is_premium: false,
  },
];

/** Merge DB-stored templates with the built-in presets. */
export function allTemplates(dbTemplates: Template[] = []): Template[] {
  const presets: Template[] = PRESET_TEMPLATES.map((t, i) => ({
    ...t,
    id: `preset-${i}`,
    is_custom: false,
  }));
  return [...dbTemplates, ...presets];
}

export interface PackageOption {
  name: string;
  price: number;
  desc: string;
}

export const PACKAGES: PackageOption[] = [
  {
    name: "WhatsApp Only",
    price: 150,
    desc: "Digital card delivered via WhatsApp with embedded QR code.",
  },
  {
    name: "WhatsApp + SMS",
    price: 300,
    desc: "WhatsApp card plus SMS invitation carrying a unique ID.",
  },
  {
    name: "Full Package",
    price: 500,
    desc: "WhatsApp, SMS, email reminders and full RSVP tracking.",
  },
];

export function generateCode(prefix = "INV"): string {
  const a = Math.random().toString(36).slice(2, 7).toUpperCase();
  const b = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${a}${b}`;
}
