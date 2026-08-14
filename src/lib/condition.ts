import type { ProductCondition } from "./types";
import { PRODUCT_CONDITIONS } from "./types";

export const CONDITION_COPY: Record<ProductCondition, string> = {
  New: "Unworn. Original packaging when available.",
  "Like New": "Worn lightly, if at all. No major flaws.",
  Excellent: "Light wear. Clean overall presentation.",
  Good: "Minor signs of wear. No major damage.",
  Fair: "Visible wear consistent with use. Still wearable.",
};

export function conditionIndex(condition: ProductCondition): number {
  return PRODUCT_CONDITIONS.indexOf(condition);
}

export function conditionFallback(condition: ProductCondition): string {
  return CONDITION_COPY[condition];
}
