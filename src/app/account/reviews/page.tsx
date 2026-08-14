import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { REVIEW_STATUS_LABELS, starsLabel } from "@/lib/store/reviews";
import { productHref } from "@/lib/utils";
import type { ReviewStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "My Reviews — RARE SUPPLiyER" };

export default async function AccountReviewsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="glass p-6 sm:p-8 space-y-3">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">MY REVIEWS</p>
        <p className="text-sm text-muted">Reviews will show here once the store database is connected.</p>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: reviews } = user
    ? await supabase
        .from("reviews")
        .select("id, product_id, rating, title, status, verified_purchase, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false })
    : { data: [] };

  const productIds = [...new Set((reviews ?? []).map((r) => r.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, slug, name").in("id", productIds)
    : { data: [] };
  const names = new Map((products ?? []).map((p) => [p.id, p]));

  return (
    <div className="glass p-6 sm:p-8 space-y-5">
      <div>
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">MY REVIEWS</p>
        <h2 className="text-2xl font-display tracking-wide mt-1">Reviews</h2>
        <p className="text-sm text-muted mt-2">Approved reviews appear on the product page. Pending reviews are only visible to you.</p>
      </div>
      {(reviews ?? []).length === 0 ? (
        <>
          <p className="text-sm text-muted">You haven&apos;t written any reviews yet.</p>
          <Link href="/account/orders">
            <Button variant="secondary" size="sm">
              VIEW ORDERS
            </Button>
          </Link>
        </>
      ) : (
        <ul className="space-y-3">
          {(reviews ?? []).map((review) => {
            const product = names.get(review.product_id);
            return (
              <li key={review.id} className="border border-border rounded-md p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{product?.name ?? "Product"}</p>
                    <p className="text-xs text-accent-secondary mt-1">{starsLabel(review.rating)} {review.title}</p>
                  </div>
                  <p className="text-[10px] tracking-[0.16em] font-mono text-muted">
                    {REVIEW_STATUS_LABELS[review.status as ReviewStatus]}
                  </p>
                </div>
                <div className="flex gap-3 mt-3 text-xs">
                  {product && (
                    <Link href={productHref(product)} className="link-line">
                      VIEW PRODUCT
                    </Link>
                  )}
                  <Link href={`/account/reviews/${review.id}`} className="link-line">
                    {review.status === "approved" || review.status === "pending" || review.status === "rejected"
                      ? "EDIT"
                      : "VIEW"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
