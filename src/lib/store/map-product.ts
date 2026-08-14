import type { Product, ProductAvailability, ProductCondition } from "@/lib/types";
import { deriveAvailability } from "@/lib/product-utils";
import { publicStorageUrl } from "@/lib/store/media";
import type { ProductStatus } from "@/lib/supabase/database.types";

export interface StorefrontProductRow {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  list_price: number;
  sale_price: number | null;
  condition: string;
  condition_details: string | null;
  description: string;
  featured: boolean;
  status: ProductStatus;
  created_at: string;
  categories?: { name: string; slug: string } | { name: string; slug: string }[] | null;
  product_images?: { storage_path: string; sort_order: number; is_primary: boolean }[] | null;
  product_sizes?: { size: string; quantity: number }[] | null;
}

export interface AdminProductRecord extends StorefrontProductRow {
  category_id: string | null;
  cost: number | null;
  seo_title: string | null;
  seo_description: string | null;
  internal_notes: string | null;
  updated_at: string;
}

export function publicUnitPrice(listPrice: number, salePrice: number | null | undefined): number {
  if (salePrice != null && salePrice > 0 && salePrice < listPrice) return salePrice;
  return listPrice;
}

export function mapStorefrontProduct(row: StorefrontProductRow): Product {
  const categoryRel = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((img) => publicStorageUrl(img.storage_path));
  const sizeRows = row.product_sizes ?? [];
  const sizes = sizeRows.map((s) => s.size);
  const availableSizes = sizeRows.filter((s) => s.quantity > 0).map((s) => s.size);
  const stock = sizeRows.reduce((sum, s) => sum + s.quantity, 0);
  const listPrice = Number(row.list_price);
  const salePrice = row.sale_price != null ? Number(row.sale_price) : null;
  const price = publicUnitPrice(listPrice, salePrice);
  const soldOut = row.status === "sold_out" || stock <= 0;
  const availability: ProductAvailability = soldOut
    ? "sold_out"
    : deriveAvailability({ stock, availableSizes });

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: categoryRel?.name ?? "Other",
    price,
    listPrice,
    salePrice: salePrice != null && salePrice > 0 && salePrice < listPrice ? salePrice : null,
    images: images.length ? images : ["/assets/products/placeholder.svg"],
    sizes,
    availableSizes,
    condition: (row.condition || "Good") as ProductCondition,
    conditionDetails: row.condition_details ?? undefined,
    description: row.description,
    featured: row.featured,
    stock,
    availability,
    status: row.status,
    createdAt: row.created_at,
    badge: soldOut ? "SOLD OUT" : undefined,
  };
}

export const STOREFRONT_PRODUCT_SELECT = `
  id, slug, sku, name, brand, list_price, sale_price, condition, condition_details,
  description, featured, status, created_at,
  categories ( name, slug ),
  product_images ( storage_path, sort_order, is_primary ),
  product_sizes ( size, quantity )
`;
