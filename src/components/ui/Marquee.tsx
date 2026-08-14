"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  items?: string[];
  reverse?: boolean;
  className?: string;
  speed?: number;
}

const DEFAULT_ITEMS = [
  "RARE SUPPLiyER",
  "REAL SIZES",
  "REAL CONDITION",
  "IN STOCK",
  "SHOP CURRENT INVENTORY",
];

export function Marquee({
  items = DEFAULT_ITEMS,
  reverse = false,
  className,
  speed = 32,
}: MarqueeProps) {
  const sequence = items.flatMap((item) => [item, "✦"]);
  const track = [...sequence, ...sequence];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border/60 py-3 select-none",
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      <div
        className={cn("flex w-max marquee-track", reverse && "marquee-reverse")}
        style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}
      >
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={cn(
              "flex items-center px-5 text-[10px] sm:text-xs tracking-[0.32em] font-mono whitespace-nowrap",
              item === "✦" ? "text-accent-secondary/70 px-1" : "text-muted"
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
