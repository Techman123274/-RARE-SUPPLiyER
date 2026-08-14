"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "@/context/CatalogContext";
import { filterProducts } from "@/lib/products";
import { getUniqueBrands, getUniqueSizes } from "@/lib/utils";
import type { ProductFilters, SortOption, ProductCategory } from "@/lib/types";
import { ProductFiltersBar, sortOptions } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FadeIn } from "@/components/ui/FadeIn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function ShopContent() {
  const searchParams = useSearchParams();
  const { products, hydrated, catalogError, refreshCatalog } = useCatalog();
  const categoryFromUrl = (searchParams.get("category") as ProductCategory | null) || "All";
  const [filters, setFilters] = useState<ProductFilters>({
    sort: "newest",
    category: categoryFromUrl,
  });
  const [urlCategory, setUrlCategory] = useState(categoryFromUrl);

  if (categoryFromUrl !== urlCategory) {
    setUrlCategory(categoryFromUrl);
    setFilters((prev) => ({ ...prev, category: categoryFromUrl }));
  }

  const brands = useMemo(
    () => getUniqueBrands(products.map((p) => p.brand)),
    [products]
  );

  const sizes = useMemo(() => {
    const allSizes = products.flatMap((p) => [...p.sizes, ...p.availableSizes]);
    return getUniqueSizes(allSizes);
  }, [products]);

  const filtered = useMemo(
    () => filterProducts(products, filters),
    [filters, products]
  );

  const updateSort = (sort: SortOption) => {
    setFilters((prev) => ({ ...prev, sort }));
  };

  return (
    <div>
      <section className="border-b border-border/60 py-10 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[10px] tracking-[0.36em] text-muted font-mono mb-2">
              CURRENT STOCK
            </p>
            <h1 className="text-4xl sm:text-6xl font-display tracking-[0.08em] mb-3">
              SHOP INVENTORY
            </h1>
            <p className="text-sm text-muted max-w-xl">
              Premium sneakers, clothing and accessories available now.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ProductFiltersBar
          filters={filters}
          onChange={setFilters}
          brands={brands}
          sizes={sizes}
          resultCount={filtered.length}
        />

        <div className="flex items-center justify-between gap-3 mb-6">
          <span className="text-[10px] tracking-[0.18em] text-muted font-mono">
            {filtered.length} PRODUCT{filtered.length !== 1 ? "S" : ""}
          </span>
          <label className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.16em] text-muted hidden sm:inline">SORT</span>
            <select
              value={filters.sort || "newest"}
              onChange={(e) => updateSort(e.target.value as SortOption)}
              className="bg-surface-elevated border border-border px-3 py-2 text-xs tracking-wider focus:outline-none focus:ring-1 focus:ring-accent-secondary/50"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!hydrated ? (
          <p className="py-20 text-center text-[10px] tracking-[0.28em] text-muted font-mono">
            LOADING INVENTORY
          </p>
        ) : catalogError && products.length === 0 ? (
          <EmptyState
            title="INVENTORY UNAVAILABLE"
            description={catalogError}
            action={
              <Button variant="secondary" onClick={() => void refreshCatalog()}>
                TRY AGAIN
              </Button>
            }
          />
        ) : (
          <ProductGrid
            products={filtered}
            emptyMessage="NO LIVE INVENTORY YET"
          />
        )}
      </div>
    </div>
  );
}
