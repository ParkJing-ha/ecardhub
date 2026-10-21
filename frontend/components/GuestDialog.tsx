"use client";

import { useEffect, useState } from "react";
import type { Guest } from "@/lib/data";
import { GUEST_CATEGORIES } from "@/lib/constants";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guest: Guest | null;
  onSave: (form: Partial<Guest>) => void | Promise<void>;
}

export default function GuestDialog({
  open,
  onOpenChange,
  guest,
  onSave,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<Guest>>({
    full_name: "",
    phone: "",
    email: "",
    category: "Single",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setError("");
        setForm(
          guest
            ? {
                full_name: guest.full_name,
                phone: guest.phone,
                email: guest.email,
                category: guest.category,
                notes: guest.notes,
              }
            : {
                full_name: "",
                phone: "",
                email: "",
                category: "Single",
                notes: "",
              },
        );
      });
    }
  }, [open, guest]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card shadow-xl">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="font-heading text-lg font-semibold">
            {guest ? "Edit guest" : "Add guest"}
          </h2>
        </div>
        <form
          id="guest-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            setError("");
            try {
              await onSave(form);
            } catch (failure) {
              setError(failure instanceof Error ? failure.message : "Unable to save this guest.");
            } finally {
              setSaving(false);
            }
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
        >
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name *</label>
            <input
              required
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
              value={form.full_name || ""}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <input
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="07xxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="guest-email" className="text-sm font-medium">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="guest-email"
                type="email"
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
              value={form.category || "Single"}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {GUEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="guest-notes" className="text-sm font-medium">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="guest-notes"
              rows={2}
              className="w-full rounded-md border border-border bg-transparent p-2"
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </form>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card p-4 sm:flex sm:justify-end sm:px-6">
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-4"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            form="guest-form"
            className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground"
          >
            {saving ? "Saving…" : guest ? "Save changes" : "Add guest"}
          </button>
        </div>
      </div>
    </div>
  );
}
