import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { REVIEW_STATUS_LABELS } from "@/lib/store/reviews";
import type { ReviewStatus } from "@/lib/supabase/database.types";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) notFound();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!review) notFound();
  const { data: product } = await supabase.from("products").select("id, name").eq("id", review.product_id).maybeSingle();

  return (
    <div className="glass p-6 sm:p-8 space-y-5">
      <Link href="/account/reviews" className="text-xs text-muted hover:text-foreground">
        ← MY REVIEWS
      </Link>
      <p className="text-[10px] tracking-[0.22em] font-mono text-muted">
        {REVIEW_STATUS_LABELS[review.status as ReviewStatus]}
      </p>
      <h2 className="text-2xl font-display tracking-wide">Edit review</h2>
      <p className="text-sm text-muted">Edits go back to pending moderation before they are public again.</p>
      <ReviewForm
        productId={review.product_id}
        productName={product?.name ?? "Product"}
        reviewId={review.id}
        defaultRating={review.rating}
        defaultTitle={review.title}
        defaultBody={review.body}
        sizePurchased={review.size_purchased}
      />
    </div>
  );
}
