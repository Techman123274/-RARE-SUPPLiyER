"use client";

import { cn, getUniqueSizes } from "@/lib/utils";
import { motion } from "framer-motion";

interface SizeSelectorProps {
  sizes: string[];
  availableSizes: string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  label?: string;
  className?: string;
}

export function SizeSelector({
  sizes,
  availableSizes,
  selectedSize,
  onSelect,
  label = "Size",
  className,
}: SizeSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs tracking-[0.15em] font-medium uppercase">
            {label}
          </span>
          {selectedSize && (
            <span className="text-xs text-muted">Selected: {selectedSize}</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
        {getUniqueSizes(sizes).map((size) => {
          const available = availableSizes.includes(size);
          const selected = selectedSize === size;

          return (
            <motion.button
              key={size}
              whileTap={available ? { scale: 0.94 } : undefined}
              onClick={() => available && onSelect(size)}
              disabled={!available}
              aria-pressed={selected}
              aria-label={`Size ${size}${!available ? ", unavailable" : ""}`}
              className={cn(
                "min-w-[44px] h-11 px-3 text-sm font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary/50",
                selected &&
                  "border-accent-secondary text-accent-secondary",
                !selected &&
                  available &&
                  "border-border hover:border-foreground/40 text-foreground",
                !available &&
                  "border-border/30 text-muted/40 line-through cursor-not-allowed opacity-50"
              )}
            >
              {size}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
