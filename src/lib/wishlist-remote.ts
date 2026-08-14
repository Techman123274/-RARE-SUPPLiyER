import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSupabaseMarkedUnavailable, isUnavailableError, markSupabaseUnavailable } from "@/lib/supabase/errors";

export async function fetchRemoteWishlistIds(userId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured() || isSupabaseMarkedUnavailable()) return null;
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId);
    if (error) {
      if (isUnavailableError(error)) markSupabaseUnavailable();
      return null;
    }
    return (data ?? []).map((row) => row.product_id);
  } catch {
    return null;
  }
}

export async function persistWishlistItem(
  userId: string,
  productId: string,
  wished: boolean
): Promise<void> {
  if (!isSupabaseConfigured() || isSupabaseMarkedUnavailable()) return;
  try {
    const supabase = createBrowserSupabaseClient();
    if (wished) {
      await supabase.from("wishlists").upsert(
        { user_id: userId, product_id: productId },
        { onConflict: "user_id,product_id" }
      );
    } else {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
    }
  } catch {
    // Local wishlist remains the source of truth until sync is available.
  }
}
