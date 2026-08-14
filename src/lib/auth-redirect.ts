const DEFAULT_NEXT = "/account";

/** Only allow same-origin relative paths. Blocks open redirects. */
export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_NEXT;
  if (!value.startsWith("/")) return DEFAULT_NEXT;
  if (value.startsWith("//")) return DEFAULT_NEXT;
  if (value.includes("\\")) return DEFAULT_NEXT;
  if (value.includes("://")) return DEFAULT_NEXT;
  return value;
}

/** Public origin used in auth emails. Avoids localhost links when SITE_URL is set. */
export function publicSiteOrigin(fallbackOrigin?: string): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
    return fromEnv;
  }
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function authCallbackUrl(origin: string, next = DEFAULT_NEXT): string {
  const safeNext = sanitizeNextPath(next);
  const base = publicSiteOrigin(origin);
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
