"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface FullscreenRevealProps {
  product: Product;
  label?: string;
}

export function FullscreenReveal({ product, label = "RARE FIND" }: FullscreenRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.4, 1], [80, 0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.6]);

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div style={{ y: textY, opacity }} className="order-2 lg:order-1 space-y-4">
          <p className="text-[10px] tracking-[0.4em] text-accent-secondary font-mono">
            {label}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide leading-tight">
            {product.name}
          </h2>
          <p className="text-sm text-muted tracking-wider">{product.brand}</p>
          <p className="text-2xl font-mono">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted max-w-sm leading-relaxed">{product.description}</p>
          <div className="flex gap-2 pt-2">
            <span className="text-[9px] tracking-[0.2em] font-mono glass px-2 py-1 rounded">
              AUTHENTIC
            </span>
            <span className="text-[9px] tracking-[0.2em] font-mono glass px-2 py-1 rounded">
              {product.condition.toUpperCase()}
            </span>
          </div>
          <MagneticButton className="pt-4">
            <Link href={`/product/${product.id}`}>
              <Button size="lg">VIEW ITEM →</Button>
            </Link>
          </MagneticButton>
        </motion.div>

        <motion.div
          style={{ scale: imageScale }}
          className="order-1 lg:order-2 relative aspect-square max-h-[70vh] mx-auto w-full"
          data-cursor="explore"
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden glow-border shadow-elevated">
            <SafeImage
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 w-20 h-20 border border-border/30 rounded-xl glass opacity-50 hidden lg:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
