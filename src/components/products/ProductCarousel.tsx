"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { FadeIn } from "@/components/ui/FadeIn";
import { formatPrice } from "@/lib/utils";
import {
  formatAvailability,
  primarySizeLabel,
} from "@/lib/product-utils";
import type { Product } from "@/lib/types";

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

function CarouselCard({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-60, 60], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-60, 60], [-4, 4]), { stiffness: 200, damping: 20 });
  const sizeLabel = primarySizeLabel(product);

  return (
    <motion.article
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center group"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-elevated glow-border product-card-hover">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            sizes="320px"
          />
          {product.images[1] && (
            <SafeImage
              src={product.images[1]}
              alt=""
              fill
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              sizes="320px"
            />
          )}
          <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] font-mono glass px-2 py-1 rounded uppercase">
            {formatAvailability(product)}
          </span>
        </div>
        <div className="pt-4 space-y-1">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{product.brand}</p>
          <h3 className="text-sm font-medium group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <p className="text-sm font-mono">{formatPrice(product.price)}</p>
          <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-muted">
            {sizeLabel && <span>Size {sizeLabel}</span>}
            <span>{product.condition}</span>
          </div>
          <span className="inline-block mt-2 text-[10px] tracking-[0.2em] font-mono text-accent-secondary group-hover:text-foreground transition-colors">
            VIEW PRODUCT →
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function ProductCarousel({
  products,
  title = "Featured Inventory",
  subtitle = "CURRENTLY AVAILABLE",
}: ProductCarouselProps) {
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
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 overflow-hidden border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <FadeIn>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-muted font-mono mb-2">
                {subtitle}
              </p>
              <h2 className="text-2xl sm:text-3xl font-display tracking-wide">{title}</h2>
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
        className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <CarouselCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
