"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  getGuests,
  getTemplates,
  getInvitations,
  generateInvitations,
  createCustomTemplate,
  type Event,
  type Guest,
  type Invitation,
} from "@/lib/data";
import {
  allTemplates,
  PACKAGES,
  TemplateLayout,
  type TemplateCategory,
  type Template,
} from "@/lib/templates";
import TemplateCard from "@/components/templates/TemplateCard";
import InvitationCardPreview from "@/components/templates/InvitationCardPreview";
import { ArrowLeft, Loader2, Wand2, Eye, Sparkles, Upload } from "lucide-react";

const FONTS = ["Playfair Display", "Cormorant Garamond", "Inter"];
const LAYOUTS = ["centered", "split", "frame", "minimal"] as const;

export default function CardBuilderPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [existing, setExisting] = useState<Invitation[]>([]);

  const [selected, setSelected] = useState<Template | null>(null);
  const [custom, setCustom] = useState<{
    card_message?: string;
    primary_color?: string;
    accent_color?: string;
    background_color?: string;
    text_color?: string;
    font_family?: string;
    layout?: string;
  }>({});
  const [previewGuest, setPreviewGuest] = useState("");
  const [packageChoice, setPackageChoice] = useState("WhatsApp Only");
  const [channel, setChannel] = useState("WhatsApp");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ev = await getEvent(params.eventId);
        const [g, tpl, inv] = await Promise.all([
          getGuests(params.eventId).catch(() => []),
          getTemplates(params.eventId).catch(() => []),
          getInvitations(params.eventId).catch(() => []),
        ]);
        setEvent(ev);
        setGuests(g);
        setTemplates(allTemplates(tpl));
        setExisting(inv);

        const allAvailableTemplates = allTemplates(tpl);

        const requestedTemplateId = searchParams.get("template");
        const matchingTemplate = requestedTemplateId
          ? allAvailableTemplates.find(
              (template) => template.id === requestedTemplateId,
            )
          : null;

        setSelected(matchingTemplate || allAvailableTemplates[0] || null);

        setCustom({
          card_message: ev?.card_message || "",
        });

        setPreviewGuest(g[0]?.id || "");
        setPackageChoice("WhatsApp Only");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.eventId, searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!event)
    return <p className="p-8 text-muted-foreground">Event not found.</p>;

  const template: Template | null = selected
    ? {
        ...selected,
        ...custom,
        primary_color: custom.primary_color || selected.primary_color,
        accent_color: custom.accent_color || selected.accent_color,
        background_color: custom.background_color || selected.background_color,
        text_color: custom.text_color || selected.text_color,
        font_family: custom.font_family || selected.font_family,
        layout: (custom.layout || selected.layout) as TemplateLayout,
        image_data_url: selected.image_data_url,
      }
    : null;

  const guest = guests.find((g) => g.id === previewGuest) || {
    full_name: "Dear Guest",
  };

  const handleGenerate = async () => {
    if (guests.length === 0) return;
    if (!selected) return;
    setBusy(true);
    try {
      await generateInvitations(params.eventId, guests, existing, {
        event_id: params.eventId, // <-- Hapa tumeweka event_id inayotakiwa na CreateInvitationInput
        template_id: selected.id,
        channel: channel,
        package: packageChoice,
        customized_text: custom.card_message || "", // Fallback kuzuia 'undefined' string error
      });
      router.push(`/events/${params.eventId}`);
    } catch (err) {
      console.error("Mvurugiko wakati wa kutengeneza kadi:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleTemplateUpload = async (
    inputEvent: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = inputEvent.target.files?.[0];
    inputEvent.target.value = "";

    if (!file) return;

    setUploadError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Upload a PNG, JPG, or WEBP card design.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Template image must be 2 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image file."));
        reader.readAsDataURL(file);
      });

      const created = await createCustomTemplate(params.eventId, {
        name: file.name.replace(/\.[^.]+$/, "") || "Uploaded design",
        category: (event.category || "Custom Ceremony") as TemplateCategory,
        style: "Custom",
        primary_color: template?.primary_color || "#7A2E45",
        accent_color: template?.accent_color || "#C9A24B",
        background_color: template?.background_color || "#FBF7F0",
        text_color: template?.text_color || "#2A1A2E",
        font_family: template?.font_family || "Playfair Display",
        layout: "centered",
        image_data_url: imageDataUrl,
        description: "Uploaded card design with guest name and QR overlay.",
      });

      setTemplates((current) => [created, ...current]);
      setSelected(created);
      setCustom({ card_message: custom.card_message || event.card_message || "" });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not save template.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8">
      <Link
        href={`/events/${params.eventId}`}
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {event.title}
      </Link>
      <div className="card-base mb-6 overflow-hidden">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-2 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              Manage cards to send
            </div>
            <h1 className="mb-2 break-words font-heading text-2xl font-semibold sm:text-3xl">
              Card Builder
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Choose the invitation design, customize the message and visual
              style, then generate the card set your guests will receive.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">
                {guests.length}
              </div>
              <div className="text-[0.65rem] uppercase text-muted-foreground">
                Guests
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {existing.length}
              </div>
              <div className="text-[0.65rem] uppercase text-muted-foreground">
                Cards
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {templates.length}
              </div>
              <div className="text-[0.65rem] uppercase text-muted-foreground">
                Designs
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
        <div className="space-y-5 lg:col-span-2">
          <section className="card-base p-3 sm:p-4">
            <h2 className="font-heading font-semibold mb-3">
              1. Choose a template
            </h2>
            <label className="mb-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border px-3 py-4 text-center transition hover:bg-muted">
              {uploading ? (
                <Loader2 className="mb-2 h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Upload your design</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Mfumo utaweka jina la mpokeaji na QR code juu ya card yako.
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={handleTemplateUpload}
              />
            </label>
            {uploadError && (
              <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {uploadError}
              </p>
            )}
            <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={selected?.id === t.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </section>

          <section className="card-base space-y-4 p-3 sm:p-4">
            <h2 className="font-heading font-semibold">2. Customise</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ColorField
                label="Primary"
                value={template?.primary_color}
                onChange={(v) => setCustom({ ...custom, primary_color: v })}
              />
              <ColorField
                label="Accent"
                value={template?.accent_color}
                onChange={(v) => setCustom({ ...custom, accent_color: v })}
              />
              <ColorField
                label="Background"
                value={template?.background_color}
                onChange={(v) => setCustom({ ...custom, background_color: v })}
              />
              <ColorField
                label="Text"
                value={template?.text_color}
                onChange={(v) => setCustom({ ...custom, text_color: v })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs">
                <span>Font</span>
                <select
                  className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
                  value={template?.font_family || "Playfair Display"}
                  onChange={(e) =>
                    setCustom({ ...custom, font_family: e.target.value })
                  }
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-xs">
                <span>Layout</span>
                <select
                  className="min-h-11 w-full rounded-md border border-border bg-transparent px-2 capitalize"
                  value={template?.layout || "centered"}
                  onChange={(e) =>
                    setCustom({ ...custom, layout: e.target.value })
                  }
                >
                  {LAYOUTS.map((l) => (
                    <option key={l} value={l} className="capitalize">
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="space-y-1.5 text-xs block">
              <span>Card message</span>
              <textarea
                rows={2}
                className="w-full rounded-md border border-border bg-transparent p-2"
                placeholder="We request the honour of your presence..."
                value={custom.card_message || ""}
                onChange={(e) =>
                  setCustom({ ...custom, card_message: e.target.value })
                }
              />
            </label>
            <label className="space-y-1.5 text-xs block">
              <span>Preview guest</span>
              <select
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
                value={previewGuest}
                onChange={(e) => setPreviewGuest(e.target.value)}
              >
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="card-base space-y-4 p-3 sm:p-4">
            <h2 className="font-heading font-semibold">
              3. Package & dispatch
            </h2>
            <div className="space-y-2">
              {PACKAGES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPackageChoice(p.name)}
                  className={`min-h-11 w-full rounded-lg border p-3 text-left transition ${
                    packageChoice === p.name
                      ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-sm font-semibold text-primary">
                      TSh {p.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
            <label className="space-y-1.5 text-xs block">
              <span>Dispatch channel</span>
              <select
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {["WhatsApp", "SMS", "Email"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              onClick={handleGenerate}
              disabled={busy || !selected}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {busy
                ? "Generating..."
                : `Generate cards for ${guests.length} guests`}
            </button>
          </section>
        </div>

        <div className="lg:col-span-3">
          <div className="card-base p-4 sm:p-5 lg:sticky lg:top-20">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Eye className="w-4 h-4 text-muted-foreground" /> Live card
                preview
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                {packageChoice} · {channel}
              </span>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3 sm:p-5">
              <div className="mx-auto w-full max-w-sm">
                <InvitationCardPreview
                  event={event}
                  guest={guest}
                  template={template}
                  message={custom.card_message}
                />
              </div>
            </div>
            <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-center text-xs leading-5 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 shrink-0" /> Each guest receives
              a unique QR code and invitation ID for check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-xs block">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#7A2E45"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-full rounded-md border border-border bg-transparent px-2 font-mono text-xs"
        />
      </div>
    </label>
  );
}
