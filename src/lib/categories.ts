import type { Product, ProductCategory } from "./types";
import { PRODUCT_CATEGORIES } from "./types";
import { isProductAvailable } from "./product-utils";

export interface CategoryCard {
  category: ProductCategory;
  count: number;
  image: string | null;
}

export function getActiveCategories(products: Product[]): CategoryCard[] {
  const names = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const ordered = [
    ...PRODUCT_CATEGORIES.filter((c) => names.includes(c)),
    ...names.filter((c) => !PRODUCT_CATEGORIES.includes(c)),
  ];
  return ordered
    .map((category) => {
      const inCategory = products.filter((p) => p.category === category);
      const available = inCategory.filter(isProductAvailable);
      const cover =
        available.find((p) => p.images[0])?.images[0] ??
        inCategory.find((p) => p.images[0])?.images[0] ??
        null;
      return {
        category,
        count: available.length,
        image: cover,
      };
    })
    .filter((card) => products.some((p) => p.category === card.category));
}

export function shopHref(category?: ProductCategory) {
  if (!category) return "/shop";
  return `/shop?category=${encodeURIComponent(category)}`;
}
