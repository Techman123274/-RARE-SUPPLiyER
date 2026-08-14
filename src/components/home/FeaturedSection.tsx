"use client";

import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductGrid } from "@/components/products/ProductGrid";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Button } from "@/components/ui/Button";
import { getFeaturedProducts } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";

export function FeaturedSection() {
  const { products } = useCatalog();
  const featured = getFeaturedProducts(products);

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-secondary/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-muted font-mono mb-2">
                DROP 001 — CURATED SELECTION
              </p>
              <h2 className="text-2xl sm:text-4xl font-display tracking-wide">
                Featured Drops
              </h2>
            </div>
            <MagneticButton className="hidden sm:block">
              <Link href="/shop">
                <Button variant="ghost" size="sm">
                  VIEW ALL →
                </Button>
              </Link>
            </MagneticButton>
          </div>
        </FadeIn>

        <ProductGrid products={featured.slice(0, 8)} />

        <FadeIn delay={0.2}>
          <div className="mt-10 text-center sm:hidden">
            <Link href="/shop">
              <Button variant="secondary">VIEW ALL PRODUCTS</Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
