"use client";

import { useEffect, useState } from "react";
import { CHECKPOINTS } from "@/lib/constants";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (form: {
    usher_name: string;
    usher_email: string;
    usher_phone: string;
    checkpoints: string[];
  }) => void;
}

export default function UsherDialog({ open, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState({
    usher_name: "",
    usher_email: "",
    usher_phone: "",
    checkpoints: ["Entrance"],
  });

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setForm({
          usher_name: "",
          usher_email: "",
          usher_phone: "",
          checkpoints: ["Entrance"],
        });
      });
    }
  }, [open]);

  const toggleCp = (cp: string) =>
    setForm((f) => ({
      ...f,
      checkpoints: f.checkpoints.includes(cp)
        ? f.checkpoints.filter((x) => x !== cp)
        : [...f.checkpoints, cp],
    }));

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
            Add usher (sub-user)
          </h2>
        </div>
        <form
          id="usher-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name *</label>
            <input
              required
              className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
              value={form.usher_name}
              onChange={(e) => setForm({ ...form, usher_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone</label>
              <input
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
                value={form.usher_phone}
                onChange={(e) =>
                  setForm({ ...form, usher_phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                className="min-h-11 w-full rounded-md border border-border bg-transparent px-3"
                value={form.usher_email}
                onChange={(e) =>
                  setForm({ ...form, usher_email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Checkpoints</label>
            <div className="flex flex-wrap gap-2">
              {CHECKPOINTS.map((cp) => (
                <button
                  type="button"
                  key={cp}
                  onClick={() => toggleCp(cp)}
                  className={`min-h-11 px-3 py-1.5 rounded-full text-xs border transition ${
                    form.checkpoints.includes(cp)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {cp}
                </button>
              ))}
            </div>
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
            form="usher-form"
            className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground"
          >
            Assign usher
          </button>
        </div>
      </div>
    </div>
  );
}
