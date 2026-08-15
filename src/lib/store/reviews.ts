import type { ReviewReportReason, ReviewStatus } from "@/lib/supabase/database.types";

export const REVIEW_STATUSES: ReviewStatus[] = ["pending", "approved", "rejected", "hidden"];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  hidden: "HIDDEN",
};

export const REVIEW_REPORT_REASONS: { id: ReviewReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "offensive", label: "Offensive" },
  { id: "fake", label: "Fake" },
  { id: "inappropriate", label: "Inappropriate" },
  { id: "other", label: "Other" },
];

export const REVIEW_SORTS = ["newest", "oldest", "highest", "lowest", "verified"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const PURCHASED_ORDER_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

/** Checkout has no payment yet, so pending orders are still reviewable. */
export const REVIEWABLE_ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered"] as const;

export function starsLabel(rating: number): string {
  const full = Math.max(1, Math.min(5, Math.round(rating)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}
