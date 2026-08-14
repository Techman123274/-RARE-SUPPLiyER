"use client";

import { notFound } from "next/navigation";
import { useCatalog } from "@/context/CatalogContext";
import { getProductById } from "@/lib/products";
import { ProductDetail } from "@/components/products/ProductDetail";

export function ProductPageClient({ id }: { id: string }) {
  const { products, hydrated } = useCatalog();
  const product = getProductById(products, id);

  if (!hydrated) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center text-[10px] tracking-[0.28em] text-muted font-mono">
        LOADING PRODUCT
      </div>
    );
  }

  if (!product) notFound();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProductDetail product={product} />
    </div>
  );
}
