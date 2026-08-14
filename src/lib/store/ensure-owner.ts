import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/supabase/database.types";
import {
  isSupabaseMarkedUnavailable,
  isUnavailableError,
  markSupabaseUnavailable,
} from "@/lib/supabase/errors";

type AppClient = SupabaseClient<Database>;

const PROFILE_COLUMNS =
  "id, email, display_name, avatar_url, role, is_active, created_at, updated_at";

/** Restores owner admin if the SQL helper is installed. Never throws. */
export async function restoreOwnerAdmin(supabase: AppClient): Promise<void> {
  if (isSupabaseMarkedUnavailable()) return;
  try {
    const { error } = await supabase.rpc("ensure_owner_admin");
    if (error && isUnavailableError(error)) markSupabaseUnavailable();
  } catch {
    // Helper is missing until promote-admin.sql is run.
  }
}

export async function loadProfileRow(
  supabase: AppClient,
  userId: string
): Promise<{ profile: Profile | null; unavailable: boolean }> {
  if (isSupabaseMarkedUnavailable()) {
    return { profile: null, unavailable: true };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isUnavailableError(error)) markSupabaseUnavailable();
    return { profile: null, unavailable: true };
  }

  return { profile: data ?? null, unavailable: false };
}
