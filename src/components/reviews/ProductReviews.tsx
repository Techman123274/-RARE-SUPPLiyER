"use client";

import { useMemo, useState, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { reportReview } from "@/app/account/reviews/actions";
import { REVIEW_REPORT_REASONS, starsLabel, type ReviewSort } from "@/lib/store/reviews";
import { reviewImageUrl } from "@/lib/store/media";
import type { ProductRatingRow, ReviewImageRow, ReviewRow } from "@/lib/supabase/database.types";

type PublicReview = Pick<
  ReviewRow,
  "id" | "rating" | "title" | "body" | "size_purchased" | "verified_purchase" | "created_at" | "user_id"
> & {
  display_name: string;
  images: Pick<ReviewImageRow, "id" | "storage_path">[];
};

export function ProductReviews({
  stats,
  reviews,
}: {
  stats: ProductRatingRow | null;
  reviews: PublicReview[];
}) {
  const { isAuthenticated } = useAuth();
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [stars, setStars] = useState<number | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const visible = useMemo(() => {
    let list = [...reviews];
    if (stars) list = list.filter((r) => r.rating === stars);
    list.sort((a, b) => {
      if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      if (sort === "verified") return Number(b.verified_purchase) - Number(a.verified_purchase);
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }, [reviews, sort, stars]);

  const count = stats?.review_count ?? 0;
  const avg = stats?.average_rating ?? 0;

  return (
    <section className="mt-16 sm:mt-24 pt-12 border-t border-border">
      <p className="text-[10px] tracking-[0.28em] font-mono text-muted mb-3">REVIEWS</p>
      {count === 0 ? (
        <div className="glass p-8 text-center">
          <h2 className="text-2xl font-display tracking-wide mb-2">NO REVIEWS YET</h2>
          <p className="text-sm text-muted">Be the first to review this product.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-accent-secondary tracking-[0.2em] text-sm">{starsLabel(avg)}</p>
              <p className="text-4xl font-display mt-1">{Number(avg).toFixed(1)}</p>
              <p className="text-sm text-muted mt-1">{count} review{count === 1 ? "" : "s"}</p>
            </div>
            <StarBars stats={stats} />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ReviewSort)}
              className="bg-surface-elevated border border-border rounded-md px-3 py-2 text-xs tracking-wider"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
              <option value="verified">Verified purchases</option>
            </select>
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars((s) => (s === n ? null : n))}
                className={`px-3 py-2 text-xs border rounded-md ${
                  stars === n ? "border-foreground bg-foreground text-background" : "border-border text-muted"
                }`}
              >
                {n} star{n === 1 ? "" : "s"}
              </button>
            ))}
          </div>

          <ul className="space-y-4">
            {visible.map((review) => (
              <li key={review.id} className="glass rounded-lg p-5 space-y-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{review.display_name}</p>
                    <p className="text-accent-secondary text-xs tracking-widest mt-1">{starsLabel(review.rating)}</p>
                  </div>
                  <p className="text-[11px] text-muted">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] tracking-[0.16em] font-mono">
                  {review.verified_purchase && (
                    <span className="px-2 py-1 rounded border border-emerald-400/30 text-emerald-300">VERIFIED PURCHASE</span>
                  )}
                  {review.size_purchased && (
                    <span className="px-2 py-1 rounded border border-border text-muted">SIZE {review.size_purchased}</span>
                  )}
                </div>
                <p className="font-medium">{review.title}</p>
                <p className="text-sm text-muted whitespace-pre-wrap">{review.body}</p>
                {review.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {review.images.map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={reviewImageUrl(img.storage_path)}
                        alt=""
                        className="h-20 w-20 object-cover rounded-md border border-border"
                      />
                    ))}
                  </div>
                )}
                {isAuthenticated && (
                  <button
                    type="button"
                    className="text-[10px] tracking-[0.16em] font-mono text-muted hover:text-foreground"
                    onClick={() => {
                      setReportId(review.id);
                      setReportMsg(null);
                    }}
                  >
                    REPORT REVIEW
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {reportId && (
        <ReportModal
          reviewId={reportId}
          message={reportMsg}
          onClose={() => setReportId(null)}
          onDone={(msg) => setReportMsg(msg)}
        />
      )}
    </section>
  );
}

function StarBars({ stats }: { stats: ProductRatingRow | null }) {
  if (!stats) return null;
  const total = Math.max(1, stats.review_count);
  const rows = [
    [5, stats.stars_5],
    [4, stats.stars_4],
    [3, stats.stars_3],
    [2, stats.stars_2],
    [1, stats.stars_1],
  ] as const;
  return (
    <div className="w-full sm:w-64 space-y-1.5">
      {rows.map(([n, count]) => (
        <div key={n} className="flex items-center gap-2 text-[11px] text-muted">
          <span className="w-8">{n}★</span>
          <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div className="h-full bg-accent-secondary" style={{ width: `${(count / total) * 100}%` }} />
          </div>
          <span className="w-6 text-right font-mono">{count}</span>
        </div>
      ))}
    </div>
  );
}

function ReportModal({
  reviewId,
  message,
  onClose,
  onDone,
}: {
  reviewId: string;
  message: string | null;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        className="glass-strong p-6 w-full max-w-sm space-y-4"
        action={(formData) => {
          start(async () => {
            const result = await reportReview(formData);
            if (result.ok) {
              onDone("Report received. We'll review it.");
              onClose();
            } else {
              onDone(result.error ?? "Could not send report.");
            }
          });
        }}
      >
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">REPORT REVIEW</p>
        <input type="hidden" name="review_id" value={reviewId} />
        <select name="reason" className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm">
          {REVIEW_REPORT_REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea
          name="details"
          rows={3}
          placeholder="Optional details"
          className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm"
        />
        {message && <p className="text-xs text-muted">{message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="px-4 py-2 bg-foreground text-background rounded-md text-sm">
            {pending ? "SENDING..." : "SUBMIT"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
