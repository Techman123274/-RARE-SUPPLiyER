import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function productHref(product: { slug?: string; id: string }): string {
  return `/product/${product.slug || product.id}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function getUniqueBrands(brands: string[]): string[] {
  return [...new Set(brands.map((b) => b.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getUniqueSizes(sizes: string[]): string[] {
  const unique = [...new Set(sizes.map((s) => String(s).trim()).filter(Boolean))];
  const numeric = unique.filter((s) => /^\d/.test(s));
  const alpha = unique.filter((s) => !/^\d/.test(s));
  return [
    ...numeric.sort((a, b) => parseFloat(a) - parseFloat(b)),
    ...alpha.sort((a, b) => a.localeCompare(b)),
  ];
}
