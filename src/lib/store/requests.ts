import type { ItemRequestPriority, ItemRequestStatus } from "@/lib/supabase/database.types";

export const REQUEST_CATEGORIES = ["Sneakers", "Clothing", "Accessories", "Other"] as const;
export const REQUEST_CONDITIONS = ["New", "Like New", "Excellent", "Good", "Any"] as const;

export const REQUEST_STATUSES: ItemRequestStatus[] = [
  "submitted",
  "under_review",
  "looking",
  "found",
  "available",
  "unable_to_source",
  "cancelled",
];

export const REQUEST_STATUS_LABELS: Record<ItemRequestStatus, string> = {
  submitted: "SUBMITTED",
  under_review: "UNDER REVIEW",
  looking: "LOOKING",
  found: "FOUND",
  available: "AVAILABLE",
  unable_to_source: "UNABLE TO SOURCE",
  cancelled: "CANCELLED",
};

export const REQUEST_PRIORITIES: ItemRequestPriority[] = ["low", "normal", "high", "urgent"];

export const REQUEST_PRIORITY_LABELS: Record<ItemRequestPriority, string> = {
  low: "LOW",
  normal: "NORMAL",
  high: "HIGH",
  urgent: "URGENT",
};

export function parseBudget(text: string): { min: number | null; max: number | null } {
  const nums = (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return { min: null, max: null };
  if (nums.length === 1) return { min: null, max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

export function formatBudget(min: number | null, max: number | null, text: string | null): string {
  if (text?.trim()) return text.trim();
  if (min != null && max != null) return `$${min}–$${max}`;
  if (max != null) return `Up to $${max}`;
  if (min != null) return `From $${min}`;
  return "—";
}

export function canCancelRequest(status: ItemRequestStatus): boolean {
  return status === "submitted" || status === "under_review" || status === "looking";
}
