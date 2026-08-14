import type { ProductBadge as BadgeType } from "@/lib/types";
import { cn } from "@/lib/utils";

const badgeStyles: Record<BadgeType, string> = {
  NEW: "bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30",
  "SOLD OUT": "bg-red-500/15 text-red-400 border-red-500/30",
  RESTOCK: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

interface ProductBadgeProps {
  badge: BadgeType;
  className?: string;
}

export function ProductBadge({ badge, className }: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-widest border rounded-sm backdrop-blur-sm",
        badgeStyles[badge],
        className
      )}
    >
      {badge}
    </span>
  );
}
