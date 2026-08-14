export type ProductBadge = "NEW" | "SOLD OUT" | "RESTOCK";

export type ProductCategory = string;

export type ProductStatus = "draft" | "active" | "sold_out" | "archived";

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  listPrice?: number;
  salePrice?: number | null;
  images: string[];
  sizes: string[];
  availableSizes: string[];
  condition: ProductCondition;
  conditionDetails?: string;
  description: string;
  badge?: ProductBadge;
  featured?: boolean;
  stock: number;
  availability: ProductAvailability;
  status?: ProductStatus;
  createdAt: string;
}

export type ProductCondition = "New" | "Like New" | "Excellent" | "Good" | "Fair";

export type ProductAvailability = "in_stock" | "low_stock" | "sold_out";

export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type AvailabilityFilter = "All" | "in_stock";

export interface ProductFilters {
  category?: ProductCategory | "All";
  brand?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition | "All";
  availability?: AvailabilityFilter;
  sort?: SortOption;
  search?: string;
}

export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type CouponType = "percent" | "fixed" | "free_shipping";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  expiresAt?: string;
  active: boolean;
  badge?: string;
  discountType?: CouponType;
}

export interface CatalogData {
  products: Product[];
  coupons: Coupon[];
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Sneakers",
  "Clothing",
  "Accessories",
  "Other",
];

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  "New",
  "Like New",
  "Excellent",
  "Good",
  "Fair",
];
