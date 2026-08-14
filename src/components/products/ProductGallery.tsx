"use client";

import { useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useMotionPrefs";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ProductGallery({ images, alt, className }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStart = useRef<number | null>(null);
  const pinchStart = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const go = (next: number) => {
    if (!images.length) return;
    setActiveIndex((next + images.length) % images.length);
    setZoomed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setZoomed((z) => !z);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="relative aspect-square overflow-hidden border border-border studio-well cursor-zoom-in"
        data-product-image
        data-cursor="explore"
        onClick={handleClick}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStart.current = Math.hypot(dx, dy);
            return;
          }
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchStart.current) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (dist - pinchStart.current > 24) setZoomed(true);
            if (pinchStart.current - dist > 24) setZoomed(false);
          }
        }}
        onTouchEnd={(e) => {
          pinchStart.current = null;
          if (touchStart.current === null) return;
          const diff = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(diff) > 40) go(diff > 0 ? activeIndex - 1 : activeIndex + 1);
          touchStart.current = null;
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{
              opacity: 1,
              scale: zoomed ? 1.7 : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
          >
            <SafeImage
              src={images[activeIndex]}
              alt={`${alt} - image ${activeIndex + 1}`}
              fill
              className="object-contain p-6 sm:p-10"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === activeIndex ? "w-5 bg-foreground" : "w-1.5 bg-white/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                setZoomed(false);
              }}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border transition-all duration-200 studio-well",
                i === activeIndex
                  ? "border-accent-secondary"
                  : "border-border hover:border-foreground/30"
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
            >
              <SafeImage
                src={img}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-contain p-1.5"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
