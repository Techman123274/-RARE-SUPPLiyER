"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapStoreError } from "@/lib/store/errors";
import { REVIEWABLE_ORDER_STATUSES } from "@/lib/store/reviews";
import { userActionLimited } from "@/lib/store/rate-limit";
import type { ReviewReportReason } from "@/lib/supabase/database.types";

const REPORT_REASONS: ReviewReportReason[] = ["spam", "offensive", "fake", "inappropriate", "other"];

export async function submitProductReview(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, error: "The store database is not connected yet." };

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in to leave a review." };

    const productId = String(formData.get("product_id") ?? "").trim();
    let orderId = String(formData.get("order_id") ?? "").trim() || null;
    let orderItemId = String(formData.get("order_item_id") ?? "").trim() || null;
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const sizePurchased = String(formData.get("size_purchased") ?? "").trim();
    const rating = Number(formData.get("rating"));
    const reviewId = String(formData.get("review_id") ?? "").trim();

    if (!reviewId && (await userActionLimited(supabase, "reviews", user.id, 6, 60))) {
      return { ok: false, error: "Please wait before submitting another review." };
    }

    if (!productId) return { ok: false, error: "Missing product." };
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Choose a star rating." };
    if (!title) return { ok: false, error: "Add a review title." };
    if (body.length < 8) return { ok: false, error: "Write a little more about the product." };

    if (orderItemId) {
      const { data: item } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, size")
        .eq("id", orderItemId)
        .maybeSingle();
      const { data: order } = item
        ? await supabase.from("orders").select("id, user_id, status").eq("id", item.order_id).maybeSingle()
        : { data: null };
      const reviewable =
        item?.product_id === productId &&
        order?.user_id === user.id &&
        REVIEWABLE_ORDER_STATUSES.includes(order.status as (typeof REVIEWABLE_ORDER_STATUSES)[number]);
      if (!reviewable) {
        orderItemId = null;
        orderId = null;
      } else {
        orderId = item.order_id;
      }
    }

    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        display_name: (user.user_metadata?.display_name as string | undefined) || user.email?.split("@")[0] || null,
        role: "customer",
        is_active: true,
      });
    }

    let savedId = reviewId;
    if (reviewId) {
      const { error } = await supabase
        .from("reviews")
        .update({ rating, title: title.slice(0, 120), body: body.slice(0, 4000), size_purchased: sizePurchased || null })
        .eq("id", reviewId)
        .eq("user_id", user.id);
      if (error) return { ok: false, error: mapStoreError(error) };
    } else {
      const rpc = await supabase.rpc("submit_my_review", {
        p_product_id: productId,
        p_rating: rating,
        p_title: title.slice(0, 120),
        p_body: body.slice(0, 4000),
        p_order_id: orderId,
        p_order_item_id: orderItemId,
        p_size_purchased: sizePurchased || null,
      });

      if (rpc.error || !rpc.data) {
        const { data, error } = await supabase
          .from("reviews")
          .insert({
            product_id: productId,
            user_id: user.id,
            order_id: orderId,
            order_item_id: orderItemId,
            rating,
            title: title.slice(0, 120),
            body: body.slice(0, 4000),
            size_purchased: sizePurchased || null,
          })
          .select("id")
          .maybeSingle();
        if (error || !data?.id) {
          return { ok: false, error: mapStoreError(error ?? rpc.error ?? "Could not save review.") };
        }
        savedId = data.id;
      } else {
        savedId = rpc.data;
      }
    }

    const files = formData.getAll("photos").filter((f): f is File => typeof File !== "undefined" && f instanceof File && f.size > 0);
    for (const file of files.slice(0, 4)) {
      if (file.size > 6 * 1024 * 1024) continue;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/${savedId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("review-images").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (uploadError) continue;
      await supabase.from("review_images").insert({ review_id: savedId, storage_path: path });
    }

    revalidatePath("/account/reviews");
    revalidatePath("/account/orders");
    revalidatePath("/admin/reviews");
    revalidatePath(`/product/${productId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapStoreError(error) };
  }
}

export async function reportReview(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "The store database is not connected yet." };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to report a review." };

  const reviewId = String(formData.get("review_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() as ReviewReportReason;
  const details = String(formData.get("details") ?? "").trim();
  if (await userActionLimited(supabase, "review_reports", user.id, 8, 60)) {
    return { ok: false, error: "Please wait before reporting another review." };
  }
  if (!reviewId) return { ok: false, error: "Missing review." };
  if (!REPORT_REASONS.includes(reason)) return { ok: false, error: "Choose a reason." };

  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason,
    details: details || null,
  });
  if (error) return { ok: false, error: mapStoreError(error) };
  revalidatePath("/admin/reviews");
  return { ok: true };
}
