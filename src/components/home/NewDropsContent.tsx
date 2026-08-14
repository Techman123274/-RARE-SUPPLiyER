"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/products/ProductGrid";
import { HorizontalShowcase } from "@/components/home/HorizontalShowcase";
import { Marquee } from "@/components/ui/Marquee";
import { FadeIn } from "@/components/ui/FadeIn";
import { SafeImage } from "@/components/ui/SafeImage";
import { EASE } from "@/lib/motion";
import type { Product } from "@/lib/types";

interface CountdownProps {
  targetDate: Date;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <p className="text-sm sm:text-base tracking-[0.25em] font-mono text-muted">
      <span className="text-foreground">{String(timeLeft.days).padStart(2, "0")}</span> DAYS
      <span className="mx-3 text-border">:</span>
      <span className="text-foreground">{String(timeLeft.hours).padStart(2, "0")}</span> HOURS
      <span className="mx-3 text-border">:</span>
      <span className="text-foreground">{String(timeLeft.mins).padStart(2, "0")}</span> MIN
      <span className="mx-3 text-border hidden sm:inline">:</span>
      <span className="text-foreground hidden sm:inline">
        {String(timeLeft.secs).padStart(2, "0")}
      </span>
      <span className="hidden sm:inline"> SEC</span>
    </p>
  );
}

interface NewDropsContentProps {
  products: Product[];
}

export function NewDropsContent({ products }: NewDropsContentProps) {
  const nextDrop = new Date();
  nextDrop.setDate(nextDrop.getDate() + 2);
  nextDrop.setHours(nextDrop.getHours() + 14);
  nextDrop.setMinutes(nextDrop.getMinutes() + 32);

  const heroProduct = products[0];

  return (
    <div>
      <section className="relative min-h-[85vh] flex items-end overflow-hidden pb-16 sm:pb-24">
        <div className="absolute inset-0 film-grain pointer-events-none opacity-25" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent-secondary/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <div>
              <FadeIn>
                <p className="text-[10px] tracking-[0.4em] text-accent-secondary font-mono mb-4">
                  DROP 001 — RELEASE
                </p>
                <h1 className="font-display text-5xl sm:text-7xl tracking-[0.06em] chrome-text mb-2">
                  NEW DROP
                </h1>
              </FadeIn>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: EASE.premium, delay: 0.2 }}
                className="my-8"
              >
                <span className="font-display text-[clamp(5rem,18vw,12rem)] leading-none chrome-text">
                  01
                </span>
              </motion.div>

              {heroProduct && (
                <FadeIn delay={0.3}>
                  <p className="text-lg font-medium mb-1">{heroProduct.name}</p>
                  <p className="text-sm text-muted mb-6">{heroProduct.brand}</p>
                </FadeIn>
              )}

              <FadeIn delay={0.4}>
                <p className="text-[10px] tracking-[0.3em] text-muted mb-3 font-mono">
                  NEXT DROP IN
                </p>
                <Countdown targetDate={nextDrop} />
              </FadeIn>
            </div>

            {heroProduct && (
              <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: EASE.premium, delay: 0.15 }}
                className="relative aspect-square max-w-md mx-auto lg:ml-auto w-full"
                data-cursor="explore"
              >
                <div className="absolute inset-0 rounded-2xl overflow-hidden glow-border shadow-elevated">
                  <SafeImage
                    src={heroProduct.images[0]}
                    alt={heroProduct.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 100vw, 480px"
                    priority
                  />
                </div>
                <div className="absolute -bottom-3 -left-3 text-[9px] tracking-[0.25em] font-mono glass px-3 py-1.5 rounded">
                  LIMITED RELEASE
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <Marquee reverse />

      {products.length > 0 && (
        <HorizontalShowcase
          products={products}
          title="THE DROP"
          subtitle="NEW ARRIVALS"
        />
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm tracking-[0.2em] font-medium font-mono">
              {products.length} NEW ITEM{products.length !== 1 ? "S" : ""}
            </h2>
            <span className="text-[10px] tracking-[0.2em] text-muted font-mono">
              AUTHENTIC • CURATED
            </span>
          </div>
        </FadeIn>
        <ProductGrid products={products} variant="large" emptyMessage="No new drops yet" />
      </section>
    </div>
  );
}
