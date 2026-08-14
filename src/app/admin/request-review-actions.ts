"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/store/require-staff";
import { mapStoreError } from "@/lib/store/errors";
import type { ItemRequestPriority, ItemRequestStatus, ModerationStatus, ReviewStatus } from "@/lib/supabase/database.types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function log(action: string, entityType: string, entityId: string, summary: string) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.rpc("log_admin_activity", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_summary: summary,
      p_metadata: {},
    });
  } catch {
    // Logging must never block the mutation.
  }
}

export async function updateItemRequestAction(formData: FormData): Promise<void> {
  await requireStaff("requests.write");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ItemRequestStatus;
  const priority = String(formData.get("priority") ?? "") as ItemRequestPriority;
  const adminResponse = String(formData.get("admin_response") ?? "");
  const assignedTo = String(formData.get("assigned_to") ?? "").trim();
  const linkedProduct = String(formData.get("linked_product_id") ?? "").trim();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_update_item_request", {
    p_id: id,
    p_status: status || undefined,
    p_priority: priority || undefined,
    p_admin_response: adminResponse,
    p_assigned_to: assignedTo || undefined,
    p_linked_product_id: linkedProduct || undefined,
    p_clear_assignee: assignedTo === "",
    p_clear_product: linkedProduct === "",
  });
  if (error) throw new Error(mapStoreError(error));
  await log("request.update", "item_request", id, `Updated request ${id.slice(0, 8)}`);
  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/account/requests");
}

export async function addRequestNoteAction(formData: FormData): Promise<void> {
  await requireStaff("requests.write");
  const id = String(formData.get("request_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_add_request_note", { p_request_id: id, p_body: body });
  if (error) throw new Error(mapStoreError(error));
  await log("request.note", "item_request", id, "Added internal request note");
  revalidatePath(`/admin/requests/${id}`);
}

export async function moderateReviewAction(formData: FormData): Promise<void> {
  await requireStaff("reviews.moderate");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  const archived = String(formData.get("archived") ?? "") === "true";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_moderate_review", {
    p_id: id,
    p_status: status || undefined,
    p_archived: String(formData.get("archived") ?? "") === "" ? undefined : archived,
  });
  if (error) throw new Error(mapStoreError(error));
  await log("review.moderate", "review", id, `Review set to ${status || (archived ? "archived" : "updated")}`);
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${id}`);
  revalidatePath("/account/reviews");
}

export async function moderateReviewImageAction(formData: FormData): Promise<void> {
  await requireStaff("reviews.moderate");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ModerationStatus;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_moderate_review_image", { p_id: id, p_status: status });
  if (error) throw new Error(mapStoreError(error));
  revalidatePath("/admin/reviews");
}

export async function resolveReportAction(formData: FormData): Promise<void> {
  await requireStaff("reviews.moderate");
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_resolve_review_report", { p_id: id, p_resolved: true });
  if (error) throw new Error(mapStoreError(error));
  revalidatePath("/admin/reviews");
}

export async function saveRequestUpdate(formData: FormData): Promise<ActionResult> {
  try {
    await updateItemRequestAction(formData);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapStoreError(error) };
  }
}
