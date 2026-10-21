"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import QRImage from "@/components/templates/QRImage";
import { getInvitation, type Event, type Guest, type Invitation } from "@/lib/data";
import type { Template } from "@/lib/templates";

interface InvitationCardPreviewProps {
  event?: Partial<Event> | null;
  guest?: Partial<Guest> | null;
  template?: Partial<Template> | null;
  code?: string;
  message?: string;
  invitation?: Partial<Invitation> | null;
  className?: string;
  allowDownload?: boolean;
}

type CardDetail = { key: string; card?: Invitation; error?: string };

/** Opens the saved card artifact; ungenerated designs show a personalization preview. */
export default function InvitationCardPreview({
  event,
  guest,
  template,
  code,
  message,
  invitation,
  className,
  allowDownload = false,
}: InvitationCardPreviewProps) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [attempt, setAttempt] = useState(0);
  const eventId = invitation?.event_id || event?.id;
  const invitationId = invitation?.id;
  const needsDetail = Boolean(invitation?.has_card_artifact !== undefined && !invitation?.card_svg && !invitation?.qr_svg && eventId && invitationId);
  const requestKey = `${eventId}:${invitationId}:${attempt}`;

  useEffect(() => {
    if (!needsDetail || !eventId || !invitationId) return;
    let active = true;
    getInvitation(eventId, invitationId)
      .then((card) => {
        if (card.has_card_artifact && !card.card_svg) throw new Error("The saved card could not be loaded.");
        if (active) setDetail({ key: requestKey, card });
      })
      .catch((failure) => {
        if (active) setDetail({ key: requestKey, error: failure instanceof Error ? failure.message : "Unable to load this card." });
      });
    return () => { active = false; };
  }, [needsDetail, eventId, invitationId, requestKey]);

  const resolvedDetail = detail?.key === requestKey ? detail : null;
  const resolvedCard = needsDetail ? resolvedDetail?.card ?? invitation : invitation;
  const snapshot = resolvedCard?.card_snapshot;
  const cardEvent = snapshot?.event ?? event;
  const cardGuest = snapshot?.guest ?? guest;
  const t = snapshot?.template ?? template ?? {};
  const primary = t.primary_color || "#7A2E45";
  const accent = t.accent_color || "#C9A24B";
  const bg = t.background_color || "#FBF7F0";
  const foreground = t.text_color || "#2A1A2E";
  const sansFont = /inter|arial|helvetica|roboto|outfit|sans/i.test(t.font_family || "");
  const font = `${t.font_family || "Georgia"}, ${sansFont ? "Arial, sans-serif" : "Georgia, serif"}`;
  const image = t.image_data_url;
  const layout = t.layout || "centered";
  const guestName = cardGuest?.full_name || resolvedCard?.guest_name || "Dear Guest";
  const title = cardEvent?.title || "You are cordially invited";
  const dateStr = cardEvent?.event_date || "Date to be announced";
  const timeStr = cardEvent?.event_time?.slice(0, 5) || "";
  const venue = cardEvent?.venue || "Venue to be announced";
  const msg = resolvedCard?.customized_text || message || cardEvent?.card_message || "Please join us for this special celebration.";
  const invCode = resolvedCard?.invitation_code || code || "";
  const cardClass = `relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl ${className || ""}`;

  if (needsDetail && !resolvedDetail?.card) {
    return (
      <div className={`${cardClass} flex items-center justify-center bg-secondary/60 p-6 text-center`}>
        {resolvedDetail?.error ? <div role="alert" className="space-y-3"><p className="text-sm text-muted-foreground">{resolvedDetail.error}</p><button type="button" className="btn-outline cm-button" onClick={() => setAttempt((current) => current + 1)}>Try again</button></div>
          : <div role="status" className="flex flex-col items-center gap-3"><Loader2 size={24} className="animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Loading saved card…</p></div>}
      </div>
    );
  }

  if (resolvedCard?.card_svg) {
    const cardUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(resolvedCard.card_svg)}`;
    return (
      <div className="w-full">
        <div className={cardClass}>
          <Image src={cardUrl} width={600} height={800} alt={`Invitation for ${guestName} to ${title}. Card ID: ${invCode}.`} className="h-auto w-full" unoptimized />
        </div>
        {allowDownload && <a className="btn-outline cm-button mt-4" href={cardUrl} download={`${invCode || "invitation"}.svg`}><Download size={16} />Download card</a>}
      </div>
    );
  }

  if (image) {
    return (
      <div className={cardClass} style={{ background: `${bg} url(${image}) center / cover no-repeat`, color: foreground, fontFamily: font, containerType: "inline-size" }}>
        <div className="absolute left-[9%] right-[9%] top-[8.5%] min-h-[12.75%] rounded-lg px-3 py-2 text-center" style={{ backgroundColor: `${bg}eb` }}>
          <p className="text-[2.3cqw]" style={{ color: primary }}>Dear</p>
          <p className="mt-1 break-words text-[4cqw] font-semibold leading-tight" style={{ color: primary }}>{guestName}</p>
        </div>
        <div className="absolute bottom-[7.25%] left-[29%] right-[29%] flex h-[20.5%] flex-col items-center justify-center rounded-lg px-2 py-1 text-center" style={{ backgroundColor: `${bg}f5` }}>
          <div className="flex w-[46%] justify-center"><QRImage data={invCode} svg={resolvedCard?.qr_svg} size={74} className="!h-auto !w-full aspect-square" /></div>
          <p className="mt-1 w-full break-all text-[1.7cqw] leading-tight">{invCode || "Unique card ID added on generation"}</p>
        </div>
      </div>
    );
  }

  const split = layout === "split";
  return (
    <div className={cardClass} style={{ background: bg, color: foreground, fontFamily: font, containerType: "inline-size" }}>
      {layout === "frame" && <><div className="pointer-events-none absolute inset-[6%] rounded-xl" style={{ border: `2px solid ${accent}` }} /><div className="pointer-events-none absolute inset-[7.5%] rounded-lg" style={{ border: `1px solid ${accent}` }} /></>}
      {split && <div className="pointer-events-none absolute inset-y-0 right-0 w-[4.33%]" style={{ background: primary }} />}
      <div className={`absolute left-[11%] right-[11%] top-[10%] ${split ? "text-left" : "text-center"}`}>
        <p className="text-[2.3cqw] uppercase tracking-widest" style={{ color: primary }}>You are invited</p>
        <p className="mt-2 break-words text-[5cqw] font-semibold leading-tight" style={{ color: primary }}>{title}</p>
        {cardEvent?.host_family_name && <p className="mt-2 text-[2.7cqw]">{cardEvent.host_family_name}</p>}
      </div>
      <div className={`absolute left-[11%] right-[11%] top-[29%] ${split ? "text-left" : "text-center"}`}>
        <p className="text-[2.7cqw]">Dear</p>
        <p className="mt-1 break-words text-[4.3cqw] font-semibold leading-tight" style={{ color: primary }}>{guestName}</p>
      </div>
      <p className={`absolute left-[11%] right-[11%] top-[43%] text-[3cqw] leading-snug ${split ? "text-left" : "text-center"}`}>{msg.length > 170 ? `${msg.slice(0, 170)}…` : msg}</p>
      <div className={`absolute left-[11%] right-[11%] top-[56%] ${split ? "text-left" : "text-center"}`}>
        <p className="text-[3.3cqw] font-medium" style={{ color: primary }}>{[dateStr, timeStr].filter(Boolean).join(" · ")}</p>
        <p className="mt-1 break-words text-[3cqw] leading-snug">{venue}</p>
        {(cardEvent?.rsvp_deadline || cardEvent?.rsvp_reply_phone) && <p className="mt-3 text-[2.2cqw]">RSVP {[cardEvent.rsvp_deadline, cardEvent.rsvp_reply_phone].filter(Boolean).join(" · ")}</p>}
      </div>
      <div className="absolute inset-x-0 top-[69%] flex justify-center gap-1.5">{cardEvent?.dress_code_colors?.slice(0, 8).map((color, index) => <span key={`${color}-${index}`} className="h-2 w-2 rounded-full" style={{ background: color }} />)}</div>
      <div className={`absolute top-[72.25%] w-[20.67%] ${split ? "left-[68%]" : "left-[39.67%]"}`}><QRImage data={invCode} svg={resolvedCard?.qr_svg} size={80} className="!h-auto !w-full aspect-square" /></div>
      <p className="absolute inset-x-[8%] bottom-[8.5%] break-all text-center font-mono text-[2cqw]" style={{ color: foreground }}>{invCode || "Unique card ID added on generation"}</p>
    </div>
  );
}
