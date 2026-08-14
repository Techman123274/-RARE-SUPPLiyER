import { cn } from "@/lib/utils";
import type { ProductAvailability } from "@/lib/types";

interface AvailabilityBadgeProps {
  label: string;
  availability: ProductAvailability;
  className?: string;
}

export function AvailabilityBadge({
  label,
  availability,
  className,
}: AvailabilityBadgeProps) {
  return (
    <span
      className={cn(
        "text-[8px] tracking-[0.15em] font-mono glass px-2 py-0.5 rounded uppercase",
        availability === "sold_out" && "text-red-300",
        availability === "low_stock" && "text-amber-200",
        availability === "in_stock" && "text-foreground/80",
        className
      )}
    >
      {label}
    </span>
  );
}
