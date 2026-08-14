"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SafeImage } from "@/components/ui/SafeImage";
import { useCatalog } from "@/context/CatalogContext";
import { getAvailableProducts, getHeroProducts } from "@/lib/products";
import { formatPrice, productHref } from "@/lib/utils";
import { primarySizeLabel } from "@/lib/product-utils";
import { useReducedMotion } from "@/hooks/useMotionPrefs";
import { EASE, DURATION } from "@/lib/motion";
import { SITE } from "@/content/site";
import type { Product } from "@/lib/types";

const TRANSITIONS = ["slide", "zoom", "mask", "blur"] as const;

function SlideImage({
  product,
  transition,
}: {
  product: Product;
  transition: (typeof TRANSITIONS)[number];
}) {
  const variants = {
    slide: {
      initial: { x: "12%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-8%", opacity: 0 },
    },
    zoom: {
      initial: { scale: 1.12, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.96, opacity: 0 },
    },
    mask: {
      initial: { clipPath: "inset(0 100% 0 0)", opacity: 1 },
      animate: { clipPath: "inset(0 0% 0 0)", opacity: 1 },
      exit: { clipPath: "inset(0 0 0 100%)", opacity: 0.85 },
    },
    blur: {
      initial: { filter: "blur(14px)", opacity: 0.4, scale: 1.04 },
      animate: { filter: "blur(0px)", opacity: 1, scale: 1 },
      exit: { filter: "blur(10px)", opacity: 0, scale: 0.98 },
    },
  };

  const v = variants[transition];

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: DURATION.cinematic, ease: EASE.premium }}
      className="absolute inset-0 studio-well"
    >
      <SafeImage
        src={product.images[0]}
        alt={product.name}
        fill
        priority
        className="object-contain p-8 sm:p-12"
        sizes="(max-width:1024px) 100vw, 52vw"
      />
    </motion.div>
  );
}

function FloatingThumbs({ products, reduced }: { products: Product[]; reduced: boolean }) {
  const spots = [
    { className: "top-[18%] left-[6%] w-20 h-20 hidden xl:block", delay: 0 },
    { className: "top-[28%] right-[8%] w-24 h-24 hidden lg:block", delay: 0.4 },
    { className: "bottom-[22%] left-[10%] w-16 h-16 hidden xl:block", delay: 0.8 },
    { className: "bottom-[18%] right-[14%] w-20 h-20 hidden lg:block", delay: 1.1 },
  ];

  return (
    <>
      {products.slice(0, spots.length).map((product, i) => (
        <motion.div
          key={product.id}
          className={`absolute rounded-lg overflow-hidden border border-border/60 studio-well ${spots[i].className}`}
          animate={reduced ? undefined : { y: [0, i % 2 === 0 ? -10 : 10, 0] }}
          transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: spots[i].delay }}
        >
          <SafeImage
            src={product.images[0]}
            alt=""
            fill
            className="object-contain p-1.5 opacity-80"
            sizes="96px"
          />
        </motion.div>
      ))}
    </>
  );
}

export function InventoryHero() {
  const { products } = useCatalog();
  const reduced = useReducedMotion();
  const slides = useMemo(() => getHeroProducts(products, 6), [products]);
  const orbitProducts = useMemo(() => getAvailableProducts(products).slice(0, 8), [products]);
  const availableCount = orbitProducts.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const total = slides.length;
  const product = slides[index];
  const transition = TRANSITIONS[index % TRANSITIONS.length];

  const go = useCallback(
    (next: number) => {
      if (!total) return;
      setIndex((next + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (!total || paused || reduced) return;
    const id = setInterval(() => go(index + 1), 5600);
    return () => clearInterval(id);
  }, [index, go, paused, reduced, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  if (!product) {
    return (
      <section className="relative min-h-[88svh] flex items-center justify-center -mt-20 pt-28">
        <div className="text-center px-6">
          <Logo variant="hero" linked={false} className="max-w-[min(80vw,420px)] mx-auto" />
          <p className="mt-6 text-sm tracking-[0.35em] text-muted font-mono">{SITE.tagline}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-hidden -mt-20 pt-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const diff = e.changedTouches[0].clientX - touchStart;
        if (Math.abs(diff) > 48) go(diff > 0 ? index - 1 : index + 1);
        setTouchStart(null);
      }}
    >
      <div className="absolute inset-0 film-grain pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[820px] aspect-square rounded-full border border-accent-secondary/15 animate-orbit" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[52vw] max-w-[620px] aspect-square rounded-full border border-white/5" />
        <motion.div
          animate={reduced ? undefined : { opacity: [0.25, 0.5, 0.25], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 right-[-8%] w-[420px] h-[420px] rounded-full bg-accent-secondary/15 blur-3xl"
        />
      </div>

      <FloatingThumbs products={orbitProducts.filter((p) => p.id !== product.id)} reduced={reduced} />

      <div className="relative z-10 min-h-[calc(100svh-5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: DURATION.slow, ease: EASE.premium, delay: 0.08 }}
        >
          <p className="text-[10px] tracking-[0.42em] text-muted font-mono mb-5">
            {SITE.tagline}
          </p>
          <div className="mb-6">
            <Logo variant="hero" linked={false} className="max-w-[min(92vw,460px)]" />
          </div>
          <h1 className="sr-only">{SITE.name}</h1>
          <p className="text-sm sm:text-base tracking-[0.28em] text-foreground/80 font-mono mb-8">
            {SITE.promise}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton>
              <Link href="/shop">
                <Button size="lg" data-cursor="cta">
                  {SITE.ctaPrimary}
                </Button>
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link href="/shop">
                <Button variant="secondary" size="lg">
                  {SITE.ctaSecondary}
                </Button>
              </Link>
            </MagneticButton>
          </div>

          <p className="mt-8 text-[10px] tracking-[0.28em] text-muted font-mono">
            {availableCount} ITEM{availableCount === 1 ? "" : "S"} IN STOCK
          </p>
        </motion.div>

        <div className="relative">
          <Link
            href={productHref(product)}
            className="block group"
            data-cursor="view"
            aria-label={`View ${product.brand} ${product.name}`}
          >
            <div className="hud-frame relative aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-border glow-border studio-well">
              <AnimatePresence mode="wait">
                <SlideImage key={product.id} product={product} transition={transition} />
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: EASE.premium }}
                    className="space-y-1.5"
                  >
                    <p className="text-[10px] tracking-[0.32em] text-accent-secondary font-mono">
                      {product.brand.toUpperCase()}
                    </p>
                    <p className="text-xl sm:text-2xl font-display tracking-wide">{product.name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted">
                      <span className="text-foreground">{formatPrice(product.price)}</span>
                      {primarySizeLabel(product) && <span>SIZE {primarySizeLabel(product)}</span>}
                      <span>{product.condition.toUpperCase()} CONDITION</span>
                    </div>
                    <span className="inline-flex pt-2 text-[10px] tracking-[0.28em] font-mono text-accent-secondary group-hover:text-foreground transition-colors">
                      VIEW PRODUCT →
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Link>

          <div className="mt-5 flex items-center gap-4">
            <p className="text-[10px] tracking-[0.32em] text-muted font-mono tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
            <div className="flex-1 h-px bg-border overflow-hidden rounded-full">
              <motion.div
                key={`${product.id}-${paused}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: paused || reduced ? 0 : 5.6,
                  ease: "linear",
                }}
                className="h-full origin-left bg-accent-secondary/80"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => go(index - 1)}
                className="w-11 h-11 rounded-full glass flex items-center justify-center hover:border-accent-secondary/40 transition-colors"
                aria-label="Previous product"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => go(index + 1)}
                className="w-11 h-11 rounded-full glass flex items-center justify-center hover:border-accent-secondary/40 transition-colors"
                aria-label="Next product"
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
