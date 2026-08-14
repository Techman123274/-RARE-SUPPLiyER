import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import type { ProductRatingRow, ReviewImageRow, ReviewRow } from "@/lib/supabase/database.types";

export async function ProductReviewsSection({ productKey }: { productKey: string }) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();

  let productId: string | null = null;
  const byId = await supabase.from("products").select("id").eq("id", productKey).maybeSingle();
  if (byId.data) productId = byId.data.id;
  else {
    const bySlug = await supabase.from("products").select("id").eq("slug", productKey).maybeSingle();
    productId = bySlug.data?.id ?? null;
  }
  if (!productId) return null;

  const [{ data: stats }, reviewsRes] = await Promise.all([
    supabase.from("product_ratings").select("*").eq("product_id", productId).maybeSingle(),
    supabase
      .from("reviews")
      .select("id, rating, title, body, size_purchased, verified_purchase, created_at, user_id")
      .eq("product_id", productId)
      .eq("status", "approved")
      .eq("archived", false)
      .order("created_at", { ascending: false }),
  ]);
  if (reviewsRes.error) return null;
  const reviews = reviewsRes.data;

  const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
  const reviewIds = (reviews ?? []).map((r) => r.id);
  const [{ data: profiles }, { data: images }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    reviewIds.length
      ? supabase
          .from("review_images")
          .select("id, review_id, storage_path")
          .in("review_id", reviewIds)
          .eq("status", "approved")
      : Promise.resolve({ data: [] as Pick<ReviewImageRow, "id" | "review_id" | "storage_path">[] }),
  ]);

  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name || "Customer"]));
  const imagesByReview = new Map<string, Pick<ReviewImageRow, "id" | "storage_path">[]>();
  for (const img of images ?? []) {
    const list = imagesByReview.get(img.review_id) ?? [];
    list.push({ id: img.id, storage_path: img.storage_path });
    imagesByReview.set(img.review_id, list);
  }

  const mapped = (reviews ?? []).map((review) => ({
    ...(review as Pick<
      ReviewRow,
      "id" | "rating" | "title" | "body" | "size_purchased" | "verified_purchase" | "created_at" | "user_id"
    >),
    display_name: names.get(review.user_id) ?? "Customer",
    images: imagesByReview.get(review.id) ?? [],
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <ProductReviews stats={(stats as ProductRatingRow | null) ?? null} reviews={mapped} />
    </div>
  );
}
