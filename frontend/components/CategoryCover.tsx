import {
  Cake,
  GraduationCap,
  Heart,
  PartyPopper,
  Plane,
  Sparkles,
  Calendar,
  Star,
} from "lucide-react";

const ICONS: Record<string, typeof Cake> = {
  Wedding: Heart,
  Graduation: GraduationCap,
  Birthday: Cake,
  "Kitchen Party": PartyPopper,
  Holiday: Sparkles,
  Anniversary: Star,
  "Send-off": Plane,
  "Custom Ceremony": Calendar,
};

const GRADIENTS: Record<string, string> = {
  Wedding: "from-rose-500/80 to-rose-800/90",
  Graduation: "from-blue-600/80 to-indigo-900/90",
  Birthday: "from-amber-400/80 to-pink-600/90",
  "Kitchen Party": "from-pink-400/80 to-fuchsia-700/90",
  Holiday: "from-orange-400/80 to-red-700/90",
  Anniversary: "from-violet-500/80 to-purple-900/90",
  "Send-off": "from-sky-400/80 to-blue-800/90",
  "Custom Ceremony": "from-slate-500/80 to-slate-800/90",
};

interface Props {
  category: string;
  title: string;
  className?: string;
}

export default function CategoryCover({ category, title, className }: Props) {
  const Icon = ICONS[category] || Calendar;
  const gradient = GRADIENTS[category] || GRADIENTS["Custom Ceremony"];
  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden ${className || ""}`}
    >
      <Icon className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10" />
      <div className="text-center px-6 relative z-10">
        <p className="text-white/70 text-xs uppercase tracking-[0.3em]">
          {category}
        </p>
        <h2 className="text-white font-heading text-xl md:text-2xl font-semibold mt-1 line-clamp-2">
          {title}
        </h2>
      </div>
    </div>
  );
}
