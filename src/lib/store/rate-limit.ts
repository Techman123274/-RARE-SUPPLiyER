import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function userActionLimited(
  supabase: Client,
  table: "item_requests" | "reviews" | "review_reports",
  userId: string,
  max: number,
  windowMinutes: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  if (table === "review_reports") {
    const { count, error } = await supabase
      .from("review_reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", userId)
      .gte("created_at", since);
    if (error) return false;
    return (count ?? 0) >= max;
  }
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) return false;
  return (count ?? 0) >= max;
}
