"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SafeImage } from "@/components/ui/SafeImage";
import { useCatalog } from "@/context/CatalogContext";
import { getFeaturedProducts } from "@/lib/products";
import { EASE } from "@/lib/motion";

export function Hero() {
  const { products } = useCatalog();
  const featured = useMemo(() => getFeaturedProducts(products), [products]);
  const slides = featured.length > 0 ? featured : products.filter((p) => p.availableSizes.length > 0).slice(0, 4);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const active = slides[index];

  return (
    <section className="relative min-h-[calc(100svh-5rem)] flex items-center justify-center overflow-hidden -mt-20 pt-28 pb-16">
      {/* Product imagery backdrop */}
      {active && (
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
              animate={{ opacity: 0.35, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 1.1, ease: EASE.premium }}
              className="absolute inset-0"
            >
              <SafeImage
                src={active.images[0]}
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-background/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/80" />
        </div>
      )}

      <div className="absolute inset-0 film-grain pointer-events-none opacity-25" />

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 right-[15%] w-14 h-14 border border-border/30 rounded-lg glass opacity-30 hidden lg:block"
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: EASE.premium }}
          className="flex justify-center mb-6"
        >
          <Logo variant="hero" linked={false} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: EASE.premium }}
          className="text-sm sm:text-base tracking-[0.35em] text-muted font-mono mb-4"
        >
          ONLINE RESALE STORE
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE.premium }}
          className="text-sm text-muted/90 mb-10 max-w-md mx-auto"
        >
          Shop our current inventory.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE.premium }}
        >
          <MagneticButton>
            <Link href="/shop">
              <Button size="lg">SHOP ALL</Button>
            </Link>
          </MagneticButton>
        </motion.div>

        {slides.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-[10px] tracking-[0.25em] text-muted font-mono"
          >
            {products.filter((p) => p.availability !== "sold_out").length} ITEMS AVAILABLE
          </motion.p>
        )}
      </div>
    </section>
  );
}
