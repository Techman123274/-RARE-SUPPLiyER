"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapStoreError } from "@/lib/store/errors";
import { parseBudget, REQUEST_CATEGORIES, REQUEST_CONDITIONS } from "@/lib/store/requests";
import { userActionLimited } from "@/lib/store/rate-limit";

export async function submitItemRequest(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "The store database is not connected yet." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "auth" };
  }

  const productName = String(formData.get("product_name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "Other").trim();
  const size = String(formData.get("size") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const condition = String(formData.get("condition_preference") ?? "Any").trim();
  const budgetText = String(formData.get("budget") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const budget = parseBudget(budgetText);

  if (await userActionLimited(supabase, "item_requests", user.id, 8, 60)) {
    return { ok: false, error: "Please wait before submitting another request." };
  }

  if (!productName) return { ok: false, error: "Tell us what you're looking for." };
  if (!REQUEST_CATEGORIES.includes(category as (typeof REQUEST_CATEGORIES)[number])) {
    return { ok: false, error: "Choose a valid category." };
  }
  if (!REQUEST_CONDITIONS.includes(condition as (typeof REQUEST_CONDITIONS)[number])) {
    return { ok: false, error: "Choose a valid condition preference." };
  }

  const { error } = await supabase.from("item_requests").insert({
    user_id: user.id,
    product_name: productName.slice(0, 200),
    brand: brand.slice(0, 80),
    category,
    size: size || null,
    color: color || null,
    condition_preference: condition,
    budget_min: budget.min,
    budget_max: budget.max,
    budget_text: budgetText || null,
    details: details || null,
  });

  if (error) return { ok: false, error: mapStoreError(error) };

  revalidatePath("/account/requests");
  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function cancelMyRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "The store database is not connected yet." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cancel_my_item_request", { p_id: requestId });
  if (error) return { ok: false, error: mapStoreError(error) };
  revalidatePath("/account/requests");
  revalidatePath(`/account/requests/${requestId}`);
  return { ok: true };
}

export async function markNotificationsRead(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServerSupabaseClient();
  await supabase.rpc("mark_notifications_read", { p_ids: null });
  revalidatePath("/account");
}
