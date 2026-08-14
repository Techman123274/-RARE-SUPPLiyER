"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { formatPrice, getUniqueSizes } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface HorizontalShowcaseProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

function ShowcaseCard({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-80, 80], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-80, 80], [-6, 6]), { stiffness: 200, damping: 20 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center group"
      data-cursor="view"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg studio-well glow-border product-card-hover">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-5 transition-transform duration-700 ease-premium group-hover:scale-105"
            sizes="320px"
          />
          {product.images[1] && (
            <SafeImage
              src={product.images[1]}
              alt=""
              fill
              className="object-contain p-5 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              sizes="320px"
            />
          )}
          <div className="absolute top-3 left-3 text-[9px] tracking-[0.25em] font-mono glass px-2 py-1 rounded">
            {product.condition.toUpperCase()}
          </div>
        </div>
        <div className="pt-4 space-y-1">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{product.brand}</p>
          <h3 className="text-sm font-medium group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <p className="text-sm font-mono">{formatPrice(product.price)}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {getUniqueSizes(product.availableSizes).slice(0, 6).map((size) => (
              <span
                key={`size-${size}`}
                className="text-[9px] font-mono text-muted border border-border/50 px-1.5 py-0.5 rounded"
              >
                {size}
              </span>
            ))}
          </div>
          <MagneticButton className="mt-3">
            <span className="text-[10px] tracking-[0.25em] font-mono text-accent-secondary group-hover:text-foreground transition-colors">
              VIEW PRODUCT →
            </span>
          </MagneticButton>
        </div>
      </Link>
    </motion.article>
  );
}

export function HorizontalShowcase({
  products,
  title = "CURRENT INVENTORY",
  subtitle = "BROWSE THE FLOOR",
}: HorizontalShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
      }
    };

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <FadeIn>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-muted font-mono mb-2">
                {subtitle}
              </p>
              <h2 className="text-2xl sm:text-4xl font-display tracking-wide">{title}</h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scrollBy(-340)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollBy(340)}
                className="w-10 h-10 rounded-full glass flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
      >
        {products.map((product) => (
          <ShowcaseCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
