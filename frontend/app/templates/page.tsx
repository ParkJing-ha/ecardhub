import Link from "next/link";
import { getTemplates, getEvents } from "@/lib/data";
import {
  EVENT_CATEGORIES,
  allTemplates,
  type TemplateCategory,
} from "@/lib/templates";
import TemplateGallery from "@/components/templates/TemplateGallery";

interface PageProps {
  searchParams?: Promise<{
    category?: string;
  }>;
}

export default async function TemplatesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const category = (params?.category || "All") as TemplateCategory | "All";

  const [dbTemplates, events] = await Promise.all([
    getTemplates(),
    getEvents(),
  ]);

  const templates = allTemplates(dbTemplates).filter(
    (template) =>
      category === "All" ||
      template.category === category ||
      template.category === "All",
  );

  const firstEventId = events[0]?.id;

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Templates
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Browse invitation card designs and choose your favourite design.
        </p>
      </header>

      {/* Categories */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {["All", ...EVENT_CATEGORIES].map((item) => (
          <Link
            key={item}
            href={`/templates?category=${encodeURIComponent(item)}`}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm transition ${
              category === item
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {item}
          </Link>
        ))}
      </div>

      {/* Templates */}
      {templates.length === 0 ? (
        <p className="text-muted-foreground">
          No templates available in this category.
        </p>
      ) : (
        <TemplateGallery templates={templates} eventId={firstEventId} />
      )}
    </div>
  );
}
