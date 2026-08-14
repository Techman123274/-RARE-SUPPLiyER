"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { submitProductReview } from "@/app/account/reviews/actions";

export function ReviewForm({
  productId,
  productName,
  orderId,
  orderItemId,
  sizePurchased,
  reviewId,
  defaultRating,
  defaultTitle,
  defaultBody,
}: {
  productId: string;
  productName: string;
  orderId?: string | null;
  orderItemId?: string | null;
  sizePurchased?: string | null;
  reviewId?: string | null;
  defaultRating?: number;
  defaultTitle?: string;
  defaultBody?: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(defaultRating ?? 5);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <div className="border border-border rounded-md p-4 space-y-2">
        <p className="text-[10px] tracking-[0.2em] font-mono text-accent-secondary">PENDING REVIEW</p>
        <p className="text-sm text-muted">
          Thanks. Your review was submitted and will appear after it is approved.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const form = new FormData(e.currentTarget);
        form.set("rating", String(rating));
        const result = await submitProductReview(form);
        setLoading(false);
        if (!result.ok) {
          setError(result.error ?? "Could not submit review.");
          return;
        }
        setDone(true);
        router.refresh();
      }}
    >
      <input type="hidden" name="product_id" value={productId} />
      {orderId && <input type="hidden" name="order_id" value={orderId} />}
      {orderItemId && <input type="hidden" name="order_item_id" value={orderItemId} />}
      {reviewId && <input type="hidden" name="review_id" value={reviewId} />}
      {sizePurchased && <input type="hidden" name="size_purchased" value={sizePurchased} />}

      <p className="text-sm font-medium">{productName}</p>
      <div className="flex gap-1" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-xl ${n <= rating ? "text-accent-secondary" : "text-muted"}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        name="title"
        required
        maxLength={120}
        defaultValue={defaultTitle}
        placeholder="Review title"
        className="w-full bg-surface-elevated border border-border rounded-md px-4 py-3 text-sm"
      />
      <textarea
        name="body"
        required
        rows={5}
        maxLength={4000}
        defaultValue={defaultBody}
        placeholder="Write your review"
        className="w-full bg-surface-elevated border border-border rounded-md px-4 py-3 text-sm resize-none"
      />
      <label className="block text-xs text-muted">
        Photos (optional, moderated before they appear)
        <input type="file" name="photos" accept="image/*" multiple className="mt-2 block text-sm" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading}>
        {reviewId ? "UPDATE REVIEW" : "SUBMIT REVIEW"}
      </Button>
    </form>
  );
}
