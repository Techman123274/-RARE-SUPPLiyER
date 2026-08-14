export function mapStoreError(error: unknown): string {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : String(error ?? "");
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";

  if (code === "23505" || /duplicate key/i.test(message)) {
    if (/sku/i.test(message)) return "A product with this SKU already exists.";
    if (/slug/i.test(message)) return "A product with this URL slug already exists.";
    if (/code/i.test(message)) return "A coupon with this code already exists.";
    if (/email/i.test(message)) return "That email is already in use.";
    if (/reviews_one_per_product/i.test(message) || /reviews_user_id_product_id/i.test(message)) {
      return "You already reviewed this product. You can edit your existing review.";
    }
    return "That value is already in use.";
  }
  if (code === "23503") return "Related record is missing or was removed.";
  if (code === "42501" || /row-level security/i.test(message) || /permission denied/i.test(message)) {
    return "You do not have permission to do that.";
  }
  if (/jwt/i.test(message) || /not authenticated/i.test(message)) {
    return "Please sign in again.";
  }
  if (!message) return "Something went wrong. Try again.";
  return "Something went wrong. Try again.";
}
