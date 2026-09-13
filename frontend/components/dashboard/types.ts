export type View =
  | "dashboard"
  | "events"
  | "create-event"
  | "templates"
  | "guests"
  | "send"
  | "qr-verify"
  | "wallet"
  | "contributions"
  | "profile"
  | "settings";

export type EventCategory =
  | "Wedding"
  | "Graduation"
  | "Birthday"
  | "Kitchen Party"
  | "Holiday"
  | "Anniversary"
  | "Send-off"
  | "Custom Ceremony";

export type GuestCategory = "Single" | "Couple" | "VIP";
export type RSVPStatus = "Pending" | "Accepted" | "Declined";
export type InviteStatus = "Not Sent" | "Sent" | "Delivered" | "Failed";
export type EventFormKey = "title" | "date" | "venue" | "guestCount";

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: GuestCategory;
  rsvp: RSVPStatus;
  invite: InviteStatus;
  checkedIn: boolean;
  checkInTime?: string;
}

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  status: "Draft" | "Active" | "Completed";
  guestCount: number;
  sentCount: number;
  rsvpCount: number;
}

export type EventStatus = "draft" | "active" | "completed" | "cancelled";

export type EventType =
  | "wedding"
  | "graduation"
  | "birthday"
  | "kitchen_party"
  | "holiday"
  | "anniversary"
  | "send_off"
  | "custom_ceremony";

export interface ApiEvent {
  id: number;
  title: string;
  event_type: EventType;
  host_family_name: string;
  event_date: string;
  event_time: string | null;
  venue: string;
  rsvp_deadline: string | null;
  rsvp_reply_phone: string;
  card_message: string;
  dress_code_colors: string[];
  description: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}
