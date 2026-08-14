import type {
  Product,
  ProductAvailability,
  ProductCategory,
  ProductCondition,
} from "./types";

const LEGACY_CATEGORY_MAP: Record<string, ProductCategory> = {
  Shoes: "Sneakers",
  Hoodies: "Clothing",
  "T-Shirts": "Clothing",
  Jackets: "Clothing",
  Pants: "Clothing",
  Electronics: "Other",
};

const LEGACY_CONDITION_MAP: Record<string, ProductCondition> = {
  Deadstock: "New",
  Used: "Good",
  Vintage: "Good",
};

const VALID_CATEGORIES: ProductCategory[] = [
  "Sneakers",
  "Clothing",
  "Accessories",
  "Other",
];

export function deriveAvailability(product: Partial<Product>): ProductAvailability {
  const stock = product.stock ?? 0;
  const sizes = product.availableSizes ?? [];
  if (product.availability === "sold_out" || stock <= 0 || sizes.length === 0) {
    return "sold_out";
  }
  if (stock <= 2) return "low_stock";
  return "in_stock";
}

export function normalizeProduct(raw: Record<string, unknown>): Product {
  const rawCategory = String(raw.category ?? "Other");
  const category = (
    VALID_CATEGORIES.includes(rawCategory as ProductCategory)
      ? rawCategory
      : LEGACY_CATEGORY_MAP[rawCategory] || "Other"
  ) as ProductCategory;

  const condition = (LEGACY_CONDITION_MAP[String(raw.condition)] ||
    raw.condition ||
    "Good") as ProductCondition;

  const availableSizes = Array.isArray(raw.availableSizes)
    ? (raw.availableSizes as string[])
    : [];

  const stock =
    typeof raw.stock === "number"
      ? raw.stock
      : availableSizes.length > 0
        ? availableSizes.length
        : 0;

  const product: Product = {
    id: String(raw.id ?? ""),
    sku: String(raw.sku ?? `RS-${String(raw.id ?? "item").slice(0, 8).toUpperCase()}`),
    slug: String(raw.slug ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    brand: String(raw.brand ?? ""),
    category,
    price: Number(raw.price ?? 0),
    images: Array.isArray(raw.images)
      ? (raw.images as string[])
      : ["/assets/products/placeholder.svg"],
    sizes: Array.isArray(raw.sizes) ? (raw.sizes as string[]) : availableSizes,
    availableSizes,
    condition,
    conditionDetails:
      typeof raw.conditionDetails === "string" ? raw.conditionDetails : undefined,
    description: String(raw.description ?? ""),
    badge: raw.badge as Product["badge"],
    featured: Boolean(raw.featured),
    stock,
    availability: deriveAvailability({
      availability: raw.availability as ProductAvailability | undefined,
      stock,
      availableSizes,
    }),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };

  return product;
}

export function isProductAvailable(product: Product): boolean {
  return product.availability !== "sold_out" && product.availableSizes.length > 0 && product.stock > 0;
}

export function formatAvailability(product: Product): string {
  switch (product.availability) {
    case "sold_out":
      return "Sold Out";
    case "low_stock":
      return "Low Stock";
    default:
      return "In Stock";
  }
}

export function primarySizeLabel(product: Product): string | null {
  if (product.availableSizes.length === 0) return null;
  if (product.availableSizes.length === 1) return product.availableSizes[0];
  return `${product.availableSizes.length} sizes`;
}

export function requiresSizeChoice(product: Product): boolean {
  return product.availableSizes.length > 1;
}
