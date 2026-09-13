"use client";

import { useEffect, useState } from "react";

import {
  EVENT_CATEGORIES,
  allTemplates,
  type Template,
  type TemplateCategory,
} from "@/lib/templates";
import { getTemplates } from "@/lib/data";

import TemplateCard from "@/components/templates/TemplateCard";

export function TemplatesView() {
  const [category, setCategory] = useState<
    TemplateCategory | "All"
  >("All");
  const [dbTemplates, setDbTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getTemplates()
      .then((items) => {
        if (mounted) setDbTemplates(items);
      })
      .catch(() => {
        if (mounted) setDbTemplates([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const templates = allTemplates(dbTemplates).filter((template) => {
    return (
      category === "All" ||
      template.category === category ||
      template.category === "All"
    );
  });

  const handleSelect = (template: Template) => {
    setSelectedTemplateId(template.id);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Templates
        </h1>

        <p
          style={{
            color: "var(--muted-foreground)",
          }}
        >
          Choose a design for your invitation card.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {["All", ...EVENT_CATEGORIES].map((item) => {
          const active = category === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() =>
                setCategory(
                  item as TemplateCategory | "All",
                )
              }
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                cursor: "pointer",
                background: active
                  ? "var(--accent-text)"
                  : "transparent",
                color: active
                  ? "#111"
                  : "var(--foreground)",
              }}
            >
              {item}
            </button>
          );
        })}
      </div>

      {templates.length === 0 ? (
        <p
          style={{
            color: "var(--muted-foreground)",
          }}
        >
          No templates found.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 18,
          }}
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplateId === template.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
