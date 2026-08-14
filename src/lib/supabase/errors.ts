/** Postgres/PostgREST is unreachable (paused, waking, or restarting). */
export function isUnavailableError(
  error: { message?: string; code?: string; status?: number } | null | undefined
): boolean {
  if (!error) return false;
  const message = `${error.message ?? ""} ${error.code ?? ""}`.toLowerCase();
  return (
    error.status === 503 ||
    error.code === "503" ||
    message.includes("503") ||
    message.includes("upstream connect") ||
    message.includes("connection failure") ||
    message.includes("connect error: 111") ||
    message.includes("service unavailable")
  );
}

const UNAVAILABLE_MESSAGE =
  "The Supabase database is paused or still starting. Restore the project in the Supabase dashboard, wait until it is healthy, then refresh.";

export function unavailableCatalogMessage(): string {
  return UNAVAILABLE_MESSAGE;
}

let downUntil = 0;

export function markSupabaseUnavailable(ms = 12_000) {
  downUntil = Date.now() + ms;
}

export function isSupabaseMarkedUnavailable(): boolean {
  return Date.now() < downUntil;
}

export function clearSupabaseUnavailable() {
  downUntil = 0;
}
