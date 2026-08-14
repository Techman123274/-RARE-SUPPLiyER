import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { PURCHASED_ORDER_STATUSES } from "@/lib/store/reviews";

export default async function WriteReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; order?: string; item?: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { product: productId, order: orderId, item: itemId } = await searchParams;
  if (!productId) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: product } = await supabase.from("products").select("id, name").eq("id", productId).maybeSingle();
  if (!product) notFound();

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    redirect(`/account/reviews/${existing.id}`);
  }

  let size: string | null = null;
  if (itemId) {
    const { data: item } = await supabase
      .from("order_items")
      .select("id, size, product_id, order_id")
      .eq("id", itemId)
      .maybeSingle();
    if (item?.product_id === productId) {
      const { data: order } = await supabase.from("orders").select("user_id, status").eq("id", item.order_id).maybeSingle();
      if (
        order?.user_id === user.id &&
        PURCHASED_ORDER_STATUSES.includes(order.status as (typeof PURCHASED_ORDER_STATUSES)[number])
      ) {
        size = item.size;
      }
    }
  }

  return (
    <div className="glass p-6 sm:p-8 space-y-5">
      <p className="text-[10px] tracking-[0.22em] font-mono text-muted">LEAVE A REVIEW</p>
      <h2 className="text-2xl font-display tracking-wide">Write a review</h2>
      <p className="text-sm text-muted">Reviews are moderated before they appear on the product page.</p>
      <ReviewForm
        productId={product.id}
        productName={product.name}
        orderId={orderId}
        orderItemId={itemId}
        sizePurchased={size}
      />
    </div>
  );
}
