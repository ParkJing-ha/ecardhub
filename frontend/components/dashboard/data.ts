import type { Event, EventCategory, Guest } from "./types";
import { icons } from "./icons";

export const seedEvents: Event[] = [
  {
    id: "1",
    title: "Amina & Karimu Wedding",
    category: "Wedding",
    date: "2026-09-14",
    venue: "Grand Serena Hotel, Dar es Salaam",
    status: "Active",
    guestCount: 320,
    sentCount: 298,
    rsvpCount: 212,
  },
  {
    id: "2",
    title: "Fatuma Graduation Ceremony",
    category: "Graduation",
    date: "2026-10-02",
    venue: "University of Dar es Salaam",
    status: "Active",
    guestCount: 80,
    sentCount: 80,
    rsvpCount: 67,
  },
  {
    id: "3",
    title: "Hassan 40th Birthday",
    category: "Birthday",
    date: "2026-08-28",
    venue: "Slipway Hotel, Dar es Salaam",
    status: "Draft",
    guestCount: 150,
    sentCount: 0,
    rsvpCount: 0,
  },
];

export const seedGuests: Guest[] = [
  { id: "g1", name: "Zainab Mtaani", phone: "+255712345678", email: "zainab@email.com", category: "Couple", rsvp: "Accepted", invite: "Delivered", checkedIn: true, checkInTime: "14:32" },
  { id: "g2", name: "Omar Rashidi", phone: "+255723456789", email: "omar.r@email.com", category: "Single", rsvp: "Accepted", invite: "Delivered", checkedIn: false },
  { id: "g3", name: "Neema Joram", phone: "+255734567890", email: "neema@email.com", category: "VIP", rsvp: "Pending", invite: "Sent", checkedIn: false },
  { id: "g4", name: "Bakari Simba", phone: "+255745678901", email: "bakari@email.com", category: "Single", rsvp: "Declined", invite: "Delivered", checkedIn: false },
  { id: "g5", name: "Halima Daud", phone: "+255756789012", email: "halima@email.com", category: "Couple", rsvp: "Accepted", invite: "Delivered", checkedIn: true, checkInTime: "14:45" },
  { id: "g6", name: "Salim Kombo", phone: "+255767890123", email: "salim@email.com", category: "VIP", rsvp: "Accepted", invite: "Delivered", checkedIn: false },
  { id: "g7", name: "Rehema Mwanga", phone: "+255778901234", email: "rehema@email.com", category: "Single", rsvp: "Pending", invite: "Not Sent", checkedIn: false },
  { id: "g8", name: "Jabir Nassoro", phone: "+255789012345", email: "jabir@email.com", category: "Couple", rsvp: "Accepted", invite: "Delivered", checkedIn: true, checkInTime: "15:02" },
];

export const transactions = [
  { id: "t1", date: "2026-08-14", desc: "Top-up via M-Pesa", amount: 50000, type: "credit" },
  { id: "t2", date: "2026-08-14", desc: "WhatsApp + SMS Package — 298 cards", amount: -29800, type: "debit" },
  { id: "t3", date: "2026-08-12", desc: "Top-up via Airtel Money", amount: 30000, type: "credit" },
  { id: "t4", date: "2026-08-10", desc: "WhatsApp Card Only — 80 cards", amount: -4800, type: "debit" },
  { id: "t5", date: "2026-08-08", desc: "Top-up via Card", amount: 20000, type: "credit" },
];

export const contributions = [
  { id: "c1", guestName: "Zainab Mtaani", amount: 50000, date: "2026-08-13", method: "M-Pesa", note: "Best wishes!" },
  { id: "c2", guestName: "Halima Daud", amount: 100000, date: "2026-08-12", method: "Airtel Money", note: "Congratulations" },
  { id: "c3", guestName: "Jabir Nassoro", amount: 75000, date: "2026-08-11", method: "M-Pesa", note: "" },
  { id: "c4", guestName: "Salim Kombo", amount: 150000, date: "2026-08-10", method: "Card", note: "With love" },
  { id: "c5", guestName: "Omar Rashidi", amount: 30000, date: "2026-08-09", method: "M-Pesa", note: "" },
];

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
