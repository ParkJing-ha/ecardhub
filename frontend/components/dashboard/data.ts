import type { EventCategory } from "./types";
import { icons } from "./icons";

export const eventCategories: EventCategory[] = [
  "Wedding",
  "Graduation",
  "Birthday",
  "Kitchen Party",
  "Holiday",
  "Anniversary",
  "Send-off",
  "Custom Ceremony",
];

export const dashboardTemplates = [
  { id: "t1", name: "Royal Elegance", preview: "linear-gradient(135deg,#4C2456,#2D1235)", accent: "#E5C158" },
  { id: "t2", name: "Garden Bloom", preview: "linear-gradient(135deg,#0a2a1a,#1a6b3d)", accent: "#22c55e" },
  { id: "t3", name: "Sunset Glow", preview: "linear-gradient(135deg,#3a0a0a,#6b1f1f)", accent: "#c97a2a" },
  { id: "t4", name: "Ocean Deep", preview: "linear-gradient(135deg,#0a1a3a,#1f3d6b)", accent: "#60a5fa" },
  { id: "t5", name: "Rose & Gold", preview: "linear-gradient(135deg,#3a0a1a,#6b1f3d)", accent: "#E0B863" },
  { id: "t6", name: "Classic White", preview: "linear-gradient(135deg,#1a1a2a,#2d2854)", accent: "#f0ece8" },
];

export const packages = [
  { id: "whatsapp", name: "WhatsApp Card Only", price: 100, desc: "Digital card via WhatsApp with QR code", icon: icons.whatsapp, color: "#22c55e" },
  { id: "whatsapp-sms", name: "WhatsApp + Normal SMS", price: 200, desc: "Card on WhatsApp plus a plain SMS fallback", icon: icons.sms, color: "#60a5fa" },
  { id: "full", name: "Full Package", price: 350, desc: "WhatsApp card, SMS, and email notification", icon: icons.send, color: "#E0B863" },
];
