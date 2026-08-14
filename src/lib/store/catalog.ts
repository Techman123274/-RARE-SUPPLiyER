import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  clearSupabaseUnavailable,
  isSupabaseMarkedUnavailable,
  isUnavailableError,
  markSupabaseUnavailable,
} from "@/lib/supabase/errors";
import { mapStorefrontProduct, STOREFRONT_PRODUCT_SELECT } from "@/lib/store/map-product";
import type { Coupon, Product } from "@/lib/types";
import type { CategoryRow, CouponRow } from "@/lib/supabase/database.types";

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    type: row.discount_type === "fixed" ? "fixed" : "percent",
    value: Number(row.amount),
    minOrder: row.min_order != null ? Number(row.min_order) : undefined,
    expiresAt: row.expires_at ?? undefined,
    active: row.active && !row.archived,
    discountType: row.discount_type,
  };
}

export async function fetchStorefrontCatalog(): Promise<{
  products: Product[];
  coupons: Coupon[];
  categories: CategoryRow[];
} | null> {
  if (!isSupabaseConfigured()) return null;
  if (isSupabaseMarkedUnavailable()) return null;

  try {
    const supabase = createBrowserSupabaseClient();

    const [productsRes, couponsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select(STOREFRONT_PRODUCT_SELECT)
        .in("status", ["active", "sold_out"])
        .order("created_at", { ascending: false }),
      supabase
        .from("coupons")
        .select("*")
        .eq("active", true)
        .eq("archived", false),
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (productsRes.error) {
      if (isUnavailableError(productsRes.error)) markSupabaseUnavailable();
      return null;
    }

    clearSupabaseUnavailable();
    return {
      products: (productsRes.data ?? []).map((row) =>
        mapStorefrontProduct(row as unknown as Parameters<typeof mapStorefrontProduct>[0])
      ),
      coupons: couponsRes.error ? [] : (couponsRes.data ?? []).map(mapCoupon),
      categories: categoriesRes.error ? [] : (categoriesRes.data ?? []),
    };
  } catch (error) {
    markSupabaseUnavailable();
    return null;
  }
}
