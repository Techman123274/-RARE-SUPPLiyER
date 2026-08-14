"use client";

import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { filterProducts, getAvailableProducts } from "@/lib/products";
import { useCatalog } from "@/context/CatalogContext";

export function LatestInventory() {
  const { products } = useCatalog();
  const latest = filterProducts(getAvailableProducts(products), { sort: "newest" }).slice(0, 8);

  if (latest.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] tracking-[0.32em] text-muted font-mono mb-2">
                JUST LISTED
              </p>
              <h2 className="text-2xl sm:text-4xl font-display tracking-[0.08em]">
                LATEST INVENTORY
              </h2>
            </div>
            <Link href="/shop" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                SHOP ALL
              </Button>
            </Link>
          </div>
        </FadeIn>

        <ProductGrid products={latest} />
      </div>
    </section>
  );
}
