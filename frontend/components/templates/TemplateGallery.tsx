"use client";

import { useRouter } from "next/navigation";
import TemplateCard from "./TemplateCard";
import type { Template } from "@/lib/templates";

interface TemplateGalleryProps {
  templates: Template[];
  eventId?: string;
}

export default function TemplateGallery({
  templates,
  eventId,
}: TemplateGalleryProps) {
  const router = useRouter();

  function handleSelect(template: Template) {
    if (!eventId) {
      router.push("/dashboard");
      return;
    }

    router.push(
      `/card-builder/${eventId}?template=${encodeURIComponent(template.id)}`,
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
