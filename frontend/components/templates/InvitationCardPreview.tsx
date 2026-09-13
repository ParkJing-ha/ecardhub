import QRImage from "@/components/templates/QRImage";
import type { Event, Guest } from "@/lib/data";
import type { Template } from "@/lib/templates";

interface InvitationCardPreviewProps {
  event?: Partial<Event> | null;
  guest?: Partial<Guest> | null;
  template?: Partial<Template> | null;
  code?: string;
  message?: string;
}

/** Visual preview of a single guest's invitation card with QR code. */
export default function InvitationCardPreview({
  event,
  guest,
  template,
  code,
  message,
}: InvitationCardPreviewProps) {
  const t = template || {};
  const primary = t.primary_color || "#7A2E45";
  const accent = t.accent_color || "#C9A24B";
  const bg = t.background_color || "#FBF7F0";
  const text = t.text_color || "#2A1A2E";
  const font = t.font_family || "Playfair Display";
  const image = t.image_data_url;

  const guestName = guest?.full_name || "Dear Guest";
  const title = event?.title || "You are cordially invited";
  const dateStr = event?.event_date
    ? new Date(event.event_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date to be announced";
  const timeStr = event?.event_time || "";
  const venue = event?.venue || "Venue to be announced";
  const msg =
    message ||
    event?.card_message ||
    "We request the honour of your presence at our celebration.";
  const invCode = code || "INV-XXXXXX";

  return (
    <div
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl"
      style={{
        background: image ? `${bg} url(${image}) center / cover no-repeat` : bg,
        color: text,
        fontFamily: font,
      }}
    >
      {image ? (
        <div className="absolute inset-0 bg-white/65 pointer-events-none" />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, ${accent}22, transparent 45%)`,
          }}
        />
      )}
      <div
        className="absolute inset-3 rounded-xl flex flex-col items-center justify-between text-center px-6 py-7"
        style={{ border: `1px solid ${accent}66` }}
      >
        <div className="w-full">
          <p
            className="text-[0.6rem] tracking-[0.3em] uppercase"
            style={{ color: accent }}
          >
            {event?.event_type
              ? event.event_type.replace(/_/g, " ")
              : "Invitation"}
          </p>
          <div
            className="mx-auto my-2 w-12 h-px"
            style={{ background: accent }}
          />
          <p
            className="text-[0.7rem] italic leading-snug"
            style={{ color: primary }}
          >
            {msg.length > 90 ? msg.slice(0, 90) + "…" : msg}
          </p>
        </div>

        <div className="w-full">
          <p
            className="text-[0.65rem] uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            We invite
          </p>
          <p
            className="text-xl font-semibold mt-1"
            style={{ color: primary, fontFamily: font }}
          >
            {guestName}
          </p>
          <p className="text-sm mt-2" style={{ fontFamily: font }}>
            {title}
          </p>
        </div>

        <div className="w-full">
          <div
            className="mx-auto my-2 w-10 h-px"
            style={{ background: accent }}
          />
          <p className="text-[0.7rem] font-medium" style={{ color: primary }}>
            {dateStr}
          </p>
          {timeStr && (
            <p className="text-[0.65rem]" style={{ color: text }}>
              {timeStr}
            </p>
          )}
          <p className="text-[0.7rem] mt-1" style={{ color: text }}>
            {venue}
          </p>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="rounded-lg p-1.5 bg-white/70">
            <QRImage data={invCode} size={88} />
          </div>
          <p
            className="text-[0.55rem] tracking-[0.15em] mt-1"
            style={{ color: accent }}
          >
            {invCode}
          </p>
        </div>
      </div>
    </div>
  );
}
