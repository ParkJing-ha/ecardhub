"use client";

import { useEffect, useState } from "react";
import type { Guest } from "@/lib/data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guests: Guest[];
  onSave: (form: {
    guest_id: string;
    amount: number;
    contribution_type: string;
    card_type: string;
    notes: string;
  }) => void;
}

export default function ContributionDialog({
  open,
  onOpenChange,
  guests,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    guest_id: "",
    amount: "",
    contribution_type: "Cash",
    card_type: "Single",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setForm({
          guest_id: guests[0]?.id || "",
          amount: "",
          contribution_type: "Cash",
          card_type: "Single",
          notes: "",
        });
      });
    }
  }, [open, guests]);

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
            Record contribution
          </h2>
        </div>
        <form
          id="contrib-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...form, amount: Number(form.amount) || 0 });
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Guest</label>
            <select
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
              value={form.guest_id}
              onChange={(e) => setForm({ ...form, guest_id: e.target.value })}
            >
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount (TSh)</label>
              <input
                type="number"
                required
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <select
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
                value={form.contribution_type}
                onChange={(e) =>
                  setForm({ ...form, contribution_type: e.target.value })
                }
              >
                {["Cash", "Mobile Money", "Card", "Other"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Contribution card type
            </label>
            <select
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-2"
              value={form.card_type}
              onChange={(e) => setForm({ ...form, card_type: e.target.value })}
            >
              {["Single", "Double/Couple"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <input
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
              value={form.notes}
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
            form="contrib-form"
            className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground"
          >
            Record
          </button>
        </div>
      </div>
    </div>
  );
}
