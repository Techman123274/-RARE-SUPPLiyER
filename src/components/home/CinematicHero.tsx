"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SafeImage } from "@/components/ui/SafeImage";
import { useCatalog } from "@/context/CatalogContext";
import { getFeaturedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { EASE, DURATION } from "@/lib/motion";
import type { Product } from "@/lib/types";

const SLIDE_META = [
  { label: "RARE FINDS", category: "Curated" },
  { label: "NEW DROPS", category: "Fresh" },
  { label: "Y2K ESSENTIALS", category: "Archive" },
  { label: "LIMITED PIECES", category: "Exclusive" },
] as const;

const TRANSITIONS = ["slide", "zoom", "mask", "blur"] as const;

function SlideImage({
  product,
  transition,
  active,
}: {
  product: Product;
  transition: (typeof TRANSITIONS)[number];
  active: boolean;
}) {
  const variants = {
    slide: {
      initial: { x: "100%", opacity: 0.6 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-30%", opacity: 0 },
    },
    zoom: {
      initial: { scale: 1.15, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
    mask: {
      initial: { clipPath: "inset(0 100% 0 0)", opacity: 1 },
      animate: { clipPath: "inset(0 0% 0 0)", opacity: 1 },
      exit: { clipPath: "inset(0 0 0 100%)", opacity: 0.8 },
    },
    blur: {
      initial: { filter: "blur(12px)", opacity: 0.5, scale: 1.02 },
      animate: { filter: "blur(0px)", opacity: 1, scale: 1 },
      exit: { filter: "blur(8px)", opacity: 0, scale: 0.98 },
    },
  };

  const v = variants[transition];

  return (
    <motion.div
      initial={v.initial}
      animate={active ? v.animate : v.exit}
      exit={v.exit}
      transition={{ duration: DURATION.cinematic, ease: EASE.premium }}
      className="absolute inset-0"
    >
      <SafeImage
        src={product.images[0]}
        alt={product.name}
        fill
        priority={active}
        className="object-cover object-center"
        sizes="100vw"
        data-cursor="explore"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
    </motion.div>
  );
}

export function CinematicHero() {
  const { products } = useCatalog();
  const reduced = useReducedMotion();
  const featured = useMemo(() => getFeaturedProducts(products).slice(0, 4), [products]);
  const slides = featured.length >= 4 ? featured : [...featured, ...featured].slice(0, 4);

  const [index, setIndex] = useState(0);
  const [introDone, setIntroDone] = useState(reduced);
  const [direction, setDirection] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const total = slides.length;

  const go = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex((next + total) % total);
    },
    [index, total]
  );

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setIntroDone(true), 2200);
    return () => clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    if (!introDone || reduced) return;
    const id = setInterval(() => go(index + 1), 5500);
    return () => clearInterval(id);
  }, [index, introDone, go, reduced]);

  const product = slides[index];
  const meta = SLIDE_META[index % SLIDE_META.length];
  const transition = TRANSITIONS[index % TRANSITIONS.length];

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const diff = e.changedTouches[0].clientX - touchStart;
        if (Math.abs(diff) > 50) go(diff > 0 ? index - 1 : index + 1);
        setTouchStart(null);
      }}
    >
      <div className="absolute inset-0 film-grain pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-accent-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [-10, 10, -10], y: [5, -5, 5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 right-[12%] w-14 h-14 border border-border/30 rounded-lg glass opacity-40 hidden lg:block"
        />
      </div>

      {/* Background slideshow */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait" custom={direction}>
          <SlideImage
            key={product.id + index}
            product={product}
            transition={transition}
            active
          />
        </AnimatePresence>
      </div>

      {/* Intro overlay */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE.premium }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: EASE.premium }}
            >
              <Logo variant="hero" linked={false} className="max-w-[min(80vw,360px)]" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 text-xs tracking-[0.4em] text-muted font-mono"
            >
              BUY • SELL • RESELL
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 min-h-[100svh] flex flex-col justify-end pb-12 sm:pb-16 pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-end justify-between gap-6 mb-6">
            <motion.p
              key={`num-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] tracking-[0.4em] text-muted font-mono"
            >
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </motion.p>
            <p className="text-[10px] tracking-[0.3em] text-muted font-mono hidden sm:block">
              EST. 2026
            </p>
          </div>

          <motion.p
            key={`cat-${index}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE.premium }}
            className="text-[10px] tracking-[0.35em] text-accent-secondary font-mono mb-3"
          >
            {meta.category.toUpperCase()}
          </motion.p>

          <motion.h1
            key={`title-${index}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: EASE.premium }}
            className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-wide leading-[0.95] chrome-text mb-4 max-w-4xl"
          >
            {meta.label}
          </motion.h1>

          <motion.div
            key={`info-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE.premium }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            <div>
              <p className="text-sm text-muted tracking-wider mb-1">{product.brand}</p>
              <p className="text-lg sm:text-xl font-medium mb-1">{product.name}</p>
              <p className="text-base font-mono">{formatPrice(product.price)}</p>
            </div>

            <div className="flex items-center gap-3">
              <MagneticButton>
                <Link href={`/product/${product.id}`}>
                  <Button size="lg">VIEW PRODUCT</Button>
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link href="/shop">
                  <Button variant="secondary" size="lg">
                    SHOP NOW
                  </Button>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>

          {/* Progress + controls */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-border relative overflow-hidden rounded-full">
              <motion.div
                key={index}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0 : 5.5, ease: "linear" }}
                className="absolute inset-y-0 left-0 bg-accent-secondary/70 origin-left"
                style={{ width: "100%" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => go(index - 1)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-accent-secondary/40 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => go(index + 1)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-accent-secondary/40 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
