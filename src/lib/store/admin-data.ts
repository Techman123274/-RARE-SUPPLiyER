import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/database.types";

export async function loadStaffProducts(): Promise<ProductRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("staff_products");
  if (error) return [];
  return data ?? [];
}

export async function loadProductExtras(productIds: string[]) {
  if (!productIds.length) {
    return { images: [] as { product_id: string; storage_path: string; sort_order: number; is_primary: boolean }[], sizes: [] as { product_id: string; size: string; quantity: number }[] };
  }
  const supabase = await createServerSupabaseClient();
  const [images, sizes] = await Promise.all([
    supabase.from("product_images").select("product_id, storage_path, sort_order, is_primary").in("product_id", productIds),
    supabase.from("product_sizes").select("product_id, size, quantity").in("product_id", productIds),
  ]);
  return { images: images.data ?? [], sizes: sizes.data ?? [] };
}
