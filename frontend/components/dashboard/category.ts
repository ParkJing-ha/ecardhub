import type { EventCategory } from "./types";

export function categoryGradient(cat: EventCategory) {
  const map: Record<EventCategory, string> = {
    Wedding: "linear-gradient(135deg,#b84c6e,#7c5cbf)",
    Graduation: "linear-gradient(135deg,#1a8066,#22c55e33)",
    Birthday: "linear-gradient(135deg,#c97a2a,#c9a84c)",
    "Kitchen Party": "linear-gradient(135deg,#7c5cbf,#60a5fa33)",
    Holiday: "linear-gradient(135deg,#22c55e,#1a8066)",
    Anniversary: "linear-gradient(135deg,#b84c6e,#c9a84c)",
    "Send-off": "linear-gradient(135deg,#60a5fa,#7c5cbf)",
    "Custom Ceremony": "linear-gradient(135deg,#c9a84c,#c97a2a)",
  };
  return map[cat] || "linear-gradient(135deg,#2d2854,#17142e)";
}

export function categoryEmoji(cat: EventCategory) {
  const map: Record<EventCategory, string> = {
    Wedding: "💍",
    Graduation: "🎓",
    Birthday: "🎂",
    "Kitchen Party": "🍽️",
    Holiday: "🎉",
    Anniversary: "💑",
    "Send-off": "✈️",
    "Custom Ceremony": "✨",
  };
  return map[cat] || "🎊";
}
