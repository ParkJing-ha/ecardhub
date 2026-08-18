export type View =
  | "dashboard"
  | "events"
  | "create-event"
  | "guests"
  | "send"
  | "qr-verify"
  | "wallet"
  | "contributions";

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
