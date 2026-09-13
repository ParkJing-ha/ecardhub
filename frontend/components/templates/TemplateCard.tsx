"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Template } from "@/lib/templates.ts";

interface TemplateCardProps {
  template: Template;
  selected?: boolean;
  onSelect: (template: Template) => void;
}

export default function TemplateCard({
  template,
  selected,
  onSelect,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={cn(
        "text-left rounded-xl border p-3 transition hover:shadow-md",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
      )}
    >
      <div
        className="aspect-[3/4] rounded-lg overflow-hidden mb-2 relative"
        style={{
          background: template.image_data_url
            ? `${template.background_color} url(${template.image_data_url}) center / cover no-repeat`
            : template.background_color,
          color: template.text_color,
        }}
      >
        {template.image_data_url && <div className="absolute inset-0 bg-white/60" />}
        <div
          className="absolute inset-2 rounded-md"
          style={{ border: `1px solid ${template.accent_color}` }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <div
            className="w-8 h-px mb-2"
            style={{ background: template.accent_color }}
          />
          <p
            className="text-[0.5rem] uppercase tracking-widest"
            style={{ color: template.accent_color }}
          >
            {template.category}
          </p>
          <p
            className="font-heading text-sm font-semibold mt-1"
            style={{ color: template.primary_color }}
          >
            {template.name}
          </p>
          <div
            className="w-6 h-6 rounded-sm mt-2"
            style={{ background: template.accent_color }}
          />
        </div>
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{template.name}</p>
          <p className="text-xs text-muted-foreground">
            {template.style} · {template.layout}
          </p>
        </div>
        {template.is_premium && (
          <span className="text-[0.6rem] shrink-0 rounded-full bg-secondary px-2 py-0.5">
            Premium
          </span>
        )}
      </div>
    </button>
  );
}
