"use client";

import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { getFeaturedProducts } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";

export function FeaturedInventory() {
  const { products } = useCatalog();
  const featured = getFeaturedProducts(products).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-2">
                AVAILABLE NOW
              </p>
              <h2 className="text-2xl sm:text-4xl font-display tracking-[0.08em]">
                FEATURED INVENTORY
              </h2>
            </div>
            <Link href="/shop" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                VIEW ALL
              </Button>
            </Link>
          </div>
        </FadeIn>

        <ProductGrid products={featured} />

        <FadeIn delay={0.12}>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/shop">
              <Button variant="secondary">VIEW ALL</Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
