import type { Product, ProductFilters } from "./types";
import { isProductAvailable } from "./product-utils";

export function filterProducts(
  products: Product[],
  filters: ProductFilters
): Product[] {
  let result = [...products];

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }

  if (filters.category && filters.category !== "All") {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.brand && filters.brand !== "All") {
    result = result.filter((p) => p.brand === filters.brand);
  }

  if (filters.size && filters.size !== "All") {
    result = result.filter((p) => p.availableSizes.includes(filters.size!));
  }

  if (filters.condition && filters.condition !== "All") {
    result = result.filter((p) => p.condition === filters.condition);
  }

  if (filters.availability === "in_stock") {
    result = result.filter((p) => isProductAvailable(p));
  }

  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "oldest":
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;
    case "newest":
    default:
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
  }

  return result;
}

export function getProductById(
  products: Product[],
  id: string
): Product | undefined {
  return products.find((p) => p.id === id || p.slug === id);
}

export function getFeaturedProducts(products: Product[]): Product[] {
  const featured = products.filter((p) => p.featured && isProductAvailable(p));
  if (featured.length > 0) return featured;
  return getAvailableProducts(products).slice(0, 8);
}

export function getAvailableProducts(products: Product[]): Product[] {
  return products.filter((p) => isProductAvailable(p));
}

export function getRelatedProducts(
  products: Product[],
  product: Product,
  limit = 4
): Product[] {
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category && isProductAvailable(p)
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const extras = products.filter(
    (p) =>
      p.id !== product.id &&
      isProductAvailable(p) &&
      !sameCategory.some((s) => s.id === p.id)
  );
  return [...sameCategory, ...extras].slice(0, limit);
}

export function getHeroProducts(products: Product[], limit = 6): Product[] {
  const featured = getFeaturedProducts(products);
  if (featured.length >= limit) return featured.slice(0, limit);
  const rest = getAvailableProducts(products).filter(
    (p) => !featured.some((f) => f.id === p.id)
  );
  return [...featured, ...rest].slice(0, limit);
}
