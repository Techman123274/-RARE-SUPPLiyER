import { SUPABASE_URL } from "@/lib/supabase/config";

export function publicStorageUrl(path: string | null | undefined, bucket = "product-images"): string {
  if (!path) return "/assets/products/placeholder.svg";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path.replace(/^\//, "")}`;
}

export function reviewImageUrl(path: string | null | undefined): string {
  return publicStorageUrl(path, "review-images");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
