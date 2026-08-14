export function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value || value.trim() === "") return fallback;
  try {
    const parsed = JSON.parse(value) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
