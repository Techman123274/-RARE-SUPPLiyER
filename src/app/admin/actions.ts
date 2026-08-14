"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireStaff } from "@/lib/store/require-staff";
import { restoreOwnerAdmin } from "@/lib/store/ensure-owner";
import { mapStoreError } from "@/lib/store/errors";
import { slugify } from "@/lib/store/media";
import type { AppRole, DiscountType, OrderStatus, ProductStatus } from "@/lib/supabase/database.types";

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

export async function loginAdmin(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=config");
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");

  await restoreOwnerAdmin(supabase);
  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) redirect("/admin/login?error=forbidden");

  await log("admin.login", "auth", "session", "Admin signed in");
  redirect("/admin");
}

export async function logoutAdmin() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function asVoid(result: Promise<ActionResult>): Promise<void> {
  await result;
}

function fail(error: unknown): ActionResult {
  return { ok: false, error: mapStoreError(error) };
}

export async function saveProduct(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("products.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const sku = String(formData.get("sku") ?? "").trim();
    if (!name || !brand || !sku) return { ok: false, error: "Name, brand, and SKU are required." };

    const slug = slugify(String(formData.get("slug") ?? "") || name);
    const listPrice = Number(formData.get("list_price") ?? 0);
    const saleRaw = String(formData.get("sale_price") ?? "");
    const costRaw = String(formData.get("cost") ?? "");
    const status = String(formData.get("status") ?? "draft") as ProductStatus;
    const publish = String(formData.get("publish") ?? "") === "1";

    const payload = {
      slug,
      sku,
      name,
      brand,
      category_id: String(formData.get("category_id") ?? "") || null,
      list_price: listPrice,
      sale_price: saleRaw === "" ? null : Number(saleRaw),
      cost: costRaw === "" ? null : Number(costRaw),
      condition: String(formData.get("condition") ?? "Good"),
      condition_details: String(formData.get("condition_details") ?? "") || null,
      description: String(formData.get("description") ?? ""),
      featured: formData.get("featured") === "on" || formData.get("featured") === "true",
      status: publish ? "active" : status,
      seo_title: String(formData.get("seo_title") ?? "") || null,
      seo_description: String(formData.get("seo_description") ?? "") || null,
      internal_notes: String(formData.get("internal_notes") ?? "") || null,
    };

    let productId = id;
    if (id) {
      const { data: previous } = await supabase.from("products").select("list_price, name").eq("id", id).maybeSingle();
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) return fail(error);
      if (previous && Number(previous.list_price) !== listPrice) {
        await log(
          "product.price",
          "product",
          id,
          `Changed ${previous.name} price from $${Number(previous.list_price)} → $${listPrice}`
        );
      } else {
        await log("product.update", "product", id, `Updated ${name}`);
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) return fail(error ?? "Could not create product.");
      productId = data.id;
      await log("product.create", "product", productId, `Created ${name}`);
    }

    const sizesRaw = String(formData.get("sizes_json") ?? "[]");
    let sizes: { size: string; quantity: number }[] = [];
    try {
      sizes = JSON.parse(sizesRaw) as { size: string; quantity: number }[];
    } catch {
      sizes = [];
    }
    await supabase.from("product_sizes").delete().eq("product_id", productId);
    if (sizes.length) {
      const { error } = await supabase.from("product_sizes").insert(
        sizes
          .filter((s) => s.size.trim())
          .map((s) => ({
            product_id: productId,
            size: s.size.trim(),
            quantity: Math.max(0, Number(s.quantity) || 0),
          }))
      );
      if (error) return fail(error);
    }

    const imagesRaw = String(formData.get("images_json") ?? "[]");
    let images: { storage_path: string; sort_order: number; is_primary: boolean }[] = [];
    try {
      images = JSON.parse(imagesRaw);
    } catch {
      images = [];
    }
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (images.length) {
      const { error } = await supabase.from("product_images").insert(
        images.map((img, index) => ({
          product_id: productId,
          storage_path: img.storage_path,
          sort_order: img.sort_order ?? index,
          is_primary: Boolean(img.is_primary) || index === 0,
        }))
      );
      if (error) return fail(error);
    }

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return { ok: true, id: productId };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveProduct(productId: string): Promise<ActionResult> {
  try {
    await requireStaff("products.write");
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .update({ status: "archived" })
      .eq("id", productId)
      .select("name")
      .single();
    if (error) return fail(error);
    await log("product.archive", "product", productId, `Archived ${data?.name ?? "product"}`);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true, id: productId };
  } catch (error) {
    return fail(error);
  }
}

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("categories.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Category name is required." };
    const payload = {
      name,
      slug: slugify(String(formData.get("slug") ?? "") || name),
      description: String(formData.get("description") ?? "") || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_active: formData.get("is_active") !== "false",
    };
    if (id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", id);
      if (error) return fail(error);
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) return fail(error);
    }
    revalidatePath("/admin/categories");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireStaff("categories.write");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return fail(error);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveCoupon(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("marketing.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) return { ok: false, error: "Coupon code is required." };
    const payload = {
      code,
      title: String(formData.get("title") ?? code),
      description: String(formData.get("description") ?? ""),
      discount_type: String(formData.get("discount_type") ?? "percent") as DiscountType,
      amount: Number(formData.get("amount") ?? 0),
      min_order: String(formData.get("min_order") ?? "") === "" ? null : Number(formData.get("min_order")),
      starts_at: String(formData.get("starts_at") ?? "") || null,
      expires_at: String(formData.get("expires_at") ?? "") || null,
      max_uses: String(formData.get("max_uses") ?? "") === "" ? null : Number(formData.get("max_uses")),
      max_uses_per_customer:
        String(formData.get("max_uses_per_customer") ?? "") === ""
          ? null
          : Number(formData.get("max_uses_per_customer")),
      active: formData.get("active") !== "false",
      archived: false,
    };
    if (id) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", id);
      if (error) return fail(error);
      await log("coupon.update", "coupon", id, `Updated coupon ${code}`);
    } else {
      const { data, error } = await supabase.from("coupons").insert(payload).select("id").single();
      if (error || !data) return fail(error ?? "Could not create coupon.");
      await log("coupon.create", "coupon", data.id, `Created coupon ${code}`);
    }
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function disableCoupon(id: string): Promise<ActionResult> {
  try {
    await requireStaff("marketing.write");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("coupons").update({ active: false }).eq("id", id);
    if (error) return fail(error);
    await log("coupon.disable", "coupon", id, "Disabled a coupon");
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveCoupon(id: string): Promise<ActionResult> {
  try {
    await requireStaff("marketing.write");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("coupons").update({ archived: true, active: false }).eq("id", id);
    if (error) return fail(error);
    await log("coupon.archive", "coupon", id, "Archived a coupon");
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveDeal(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("marketing.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Deal name is required." };
    const payload = {
      name,
      description: String(formData.get("description") ?? ""),
      discount_type: String(formData.get("discount_type") ?? "percent") as DiscountType,
      amount: Number(formData.get("amount") ?? 0),
      min_order: String(formData.get("min_order") ?? "") === "" ? null : Number(formData.get("min_order")),
      starts_at: String(formData.get("starts_at") ?? "") || null,
      ends_at: String(formData.get("ends_at") ?? "") || null,
      active: formData.get("active") !== "false",
    };
    let dealId = id;
    if (id) {
      const { error } = await supabase.from("deals").update(payload).eq("id", id);
      if (error) return fail(error);
    } else {
      const { data, error } = await supabase.from("deals").insert(payload).select("id").single();
      if (error || !data) return fail(error ?? "Could not create deal.");
      dealId = data.id;
    }
    const productIds = String(formData.get("product_ids") ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    await supabase.from("deal_products").delete().eq("deal_id", dealId);
    if (productIds.length) {
      await supabase.from("deal_products").insert(productIds.map((product_id) => ({ deal_id: dealId, product_id })));
    }
    revalidatePath("/admin/deals");
    revalidatePath("/deals");
    return { ok: true, id: dealId };
  } catch (error) {
    return fail(error);
  }
}

export async function saveBanner(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("content.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? ""),
      image_path: String(formData.get("image_path") ?? "") || null,
      cta_label: String(formData.get("cta_label") ?? "") || null,
      cta_href: String(formData.get("cta_href") ?? "") || null,
      starts_at: String(formData.get("starts_at") ?? "") || null,
      ends_at: String(formData.get("ends_at") ?? "") || null,
      active: formData.get("active") !== "false",
      sort_order: Number(formData.get("sort_order") ?? 0),
    };
    if (!payload.title) return { ok: false, error: "Banner title is required." };
    if (id) {
      const { error } = await supabase.from("banners").update(payload).eq("id", id);
      if (error) return fail(error);
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) return fail(error);
    }
    revalidatePath("/admin/content");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveHomepageSection(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("content.write");
    const supabase = await createServerSupabaseClient();
    const id = String(formData.get("id") ?? "");
    const { error } = await supabase
      .from("homepage_sections")
      .update({
        title: String(formData.get("title") ?? "") || null,
        enabled: formData.get("enabled") !== "false",
        sort_order: Number(formData.get("sort_order") ?? 0),
      })
      .eq("id", id);
    if (error) return fail(error);
    revalidatePath("/admin/content");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function saveSettings(formData: FormData): Promise<ActionResult> {
  try {
    await requireStaff("settings.write");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("site_settings")
      .update({
        store_name: String(formData.get("store_name") ?? "RARE SUPPLiyER"),
        contact_email: String(formData.get("contact_email") ?? "") || null,
        instagram_url: String(formData.get("instagram_url") ?? "") || null,
        tiktok_url: String(formData.get("tiktok_url") ?? "") || null,
        currency: String(formData.get("currency") ?? "USD"),
        shipping_flat: Number(formData.get("shipping_flat") ?? 12),
        free_shipping_threshold:
          String(formData.get("free_shipping_threshold") ?? "") === ""
            ? null
            : Number(formData.get("free_shipping_threshold")),
        tax_rate: Number(formData.get("tax_rate") ?? 0),
        maintenance_mode: formData.get("maintenance_mode") === "on",
      })
      .eq("id", "default");
    if (error) return fail(error);
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionResult> {
  try {
    await requireStaff("orders.write");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) return fail(error);
    await log("order.status", "order", orderId, `Order status changed to ${status}`);
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateStaffRole(userId: string, role: AppRole, isActive: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireStaff("admins.write");
    if (userId === ctx.user.id && role !== "admin") {
      return { ok: false, error: "You cannot remove your own admin access." };
    }
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("admin_set_profile_role", {
      p_user_id: userId,
      p_role: role,
      p_is_active: isActive,
    });
    if (error) return fail(error);
    await log("admin.role", "profile", userId, `Set role to ${role} (${isActive ? "active" : "inactive"})`);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createPendingOrder(input: {
  email: string;
  items: { productId: string; size: string; quantity: number }[];
  couponCode?: string;
  shippingAddress: Record<string, string>;
}): Promise<ActionResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Checkout is not connected yet." };
    }
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!input.items.length) return { ok: false, error: "Your cart is empty." };

    const ids = Array.from(new Set(input.items.map((i) => i.productId)));
    const [{ data: products, error: productError }, { data: sizeRows }] = await Promise.all([
      supabase.from("products").select("id, name, sku, list_price, sale_price, status").in("id", ids),
      supabase.from("product_sizes").select("product_id, size, quantity").in("product_id", ids),
    ]);
    if (productError || !products) return fail(productError ?? "Could not load products.");

    let subtotal = 0;
    const lines: {
      product_id: string;
      name: string;
      sku: string;
      size: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }[] = [];

    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.status !== "active") {
        return { ok: false, error: "One of the items is no longer available." };
      }
      const sizeRow = (sizeRows ?? []).find((s) => s.product_id === item.productId && s.size === item.size);
      if (!sizeRow || sizeRow.quantity < item.quantity) {
        return { ok: false, error: `Size ${item.size} does not have enough stock.` };
      }
      const unit =
        product.sale_price != null && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.list_price)
          ? Number(product.sale_price)
          : Number(product.list_price);
      const lineTotal = unit * item.quantity;
      subtotal += lineTotal;
      lines.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        size: item.size,
        quantity: item.quantity,
        unit_price: unit,
        line_total: lineTotal,
      });
    }

    const { data: settings } = await supabase.from("site_settings").select("shipping_flat").eq("id", "default").maybeSingle();
    const shipping = Number(settings?.shipping_flat ?? 12);

    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const { data: couponRows } = await supabase.rpc("validate_coupon_amount", {
        p_code: input.couponCode,
        p_subtotal: subtotal,
        p_shipping: shipping,
        p_user_id: user?.id ?? undefined,
      });
      const coupon = couponRows?.[0];
      if (coupon?.message) return { ok: false, error: coupon.message };
      if (coupon) {
        discount = Number(coupon.discount ?? 0);
        couponId = coupon.coupon_id;
        couponCode = coupon.code;
      }
    }

    const tax = 0;
    const total = Math.max(0, subtotal + shipping + tax - discount);
    const { data: orderNumber } = await supabase.rpc("next_order_number");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber ?? `RS-${Date.now()}`,
        user_id: user?.id ?? null,
        email: input.email,
        status: "pending",
        payment_status: "unpaid",
        subtotal,
        discount,
        shipping,
        tax,
        total,
        coupon_id: couponId,
        coupon_code: couponCode,
        shipping_address: input.shippingAddress,
      })
      .select("id")
      .single();
    if (orderError || !order) return fail(orderError ?? "Could not create order.");

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map((line) => ({ ...line, order_id: order.id }))
    );
    if (itemsError) return fail(itemsError);

    revalidatePath("/account/orders");
    revalidatePath("/admin/orders");
    return { ok: true, id: order.id };
  } catch (error) {
    return fail(error);
  }
}

export async function validateCouponCode(code: string, subtotal: number, shipping: number) {
  if (!isSupabaseConfigured()) {
    return { discount: 0, message: "Coupons are not connected yet." };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.rpc("validate_coupon_amount", {
    p_code: code,
    p_subtotal: subtotal,
    p_shipping: shipping,
    p_user_id: user?.id ?? undefined,
  });
  if (error) return { discount: 0, message: mapStoreError(error) };
  const row = data?.[0];
  if (!row) return { discount: 0, message: "This coupon code is not valid." };
  return { discount: Number(row.discount ?? 0), message: row.message, code: row.code };
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  await asVoid(saveCategory(formData));
}
export async function saveCouponAction(formData: FormData): Promise<void> {
  await asVoid(saveCoupon(formData));
}
export async function saveDealAction(formData: FormData): Promise<void> {
  await asVoid(saveDeal(formData));
}
export async function saveBannerAction(formData: FormData): Promise<void> {
  await asVoid(saveBanner(formData));
}
export async function saveHomepageSectionAction(formData: FormData): Promise<void> {
  await asVoid(saveHomepageSection(formData));
}
export async function saveSettingsAction(formData: FormData): Promise<void> {
  await asVoid(saveSettings(formData));
}
export async function disableCouponAction(formData: FormData): Promise<void> {
  await asVoid(disableCoupon(String(formData.get("id"))));
}
export async function archiveCouponAction(formData: FormData): Promise<void> {
  await asVoid(archiveCoupon(String(formData.get("id"))));
}
