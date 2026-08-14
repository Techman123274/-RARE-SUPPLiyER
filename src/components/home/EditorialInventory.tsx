"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { formatPrice } from "@/lib/utils";
import { primarySizeLabel } from "@/lib/product-utils";
import type { Product } from "@/lib/types";

function EditorialPanel({ product }: { product: Product }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.88, 1.04, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 0.4, 1], [60, 0, -28]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.25, 1, 1, 0.55]);

  return (
    <section ref={ref} className="relative min-h-[88vh] flex items-center py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <motion.div
          style={{ scale: imageScale }}
          className="relative aspect-[4/5] sm:aspect-square overflow-hidden rounded-xl border border-border studio-well hud-frame"
          data-cursor="explore"
        >
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-8 sm:p-12"
            sizes="(max-width:1024px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div style={{ y: textY, opacity }} className="space-y-4">
          <p className="text-[10px] tracking-[0.4em] text-accent-secondary font-mono">
            {product.brand.toUpperCase()}
          </p>
          <h3 className="font-display text-4xl sm:text-6xl tracking-wide leading-[0.95]">
            {product.name}
          </h3>
          <p className="text-2xl font-mono">{formatPrice(product.price)}</p>
          <div className="flex flex-wrap gap-2 text-[10px] tracking-[0.2em] font-mono text-muted">
            <span className="glass px-2.5 py-1 rounded">{product.condition.toUpperCase()}</span>
            {primarySizeLabel(product) && (
              <span className="glass px-2.5 py-1 rounded">SIZE {primarySizeLabel(product)}</span>
            )}
            <span className="glass px-2.5 py-1 rounded">{product.category.toUpperCase()}</span>
          </div>
          <MagneticButton className="pt-4">
            <Link href={`/product/${product.id}`}>
              <Button size="lg">VIEW PRODUCT</Button>
            </Link>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}

export function EditorialInventory({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="relative">
      {products.slice(0, 3).map((product) => (
        <EditorialPanel key={product.id} product={product} />
      ))}
    </div>
  );
}
