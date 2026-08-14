"use client";

import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { FeaturedInventory } from "@/components/home/FeaturedInventory";
import { useCatalog } from "@/context/CatalogContext";
import { getFeaturedProducts } from "@/lib/products";
import { useMemo } from "react";

export function HomeContent() {
  const { products } = useCatalog();
  const featured = useMemo(() => getFeaturedProducts(products), [products]);

  return (
    <>
      <Hero />
      {featured.length > 0 && (
        <ProductCarousel products={featured.slice(0, 8)} />
      )}
      <FeaturedInventory />
    </>
  );
}
