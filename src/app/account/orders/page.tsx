import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatPrice } from "@/lib/utils";
import { PURCHASED_ORDER_STATUSES } from "@/lib/store/reviews";

export default async function AccountOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="glass p-6 sm:p-8 space-y-4">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">ORDERS</p>
        <h2 className="text-2xl font-display tracking-[0.08em]">Order history</h2>
        <p className="text-sm text-muted max-w-md">Orders will show here once the store database is connected.</p>
        <Link href="/shop"><Button variant="secondary">CONTINUE SHOPPING</Button></Link>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = user
    ? await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    : { data: [] };

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("*").in("order_id", orderIds)
    : { data: [] };

  const productIds = [...new Set((items ?? []).map((i) => i.product_id).filter(Boolean))] as string[];
  const { data: reviews } = user && productIds.length
    ? await supabase.from("reviews").select("id, product_id").eq("user_id", user.id).in("product_id", productIds)
    : { data: [] };
  const reviewed = new Set((reviews ?? []).map((r) => r.product_id));

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return (
    <div className="glass p-6 sm:p-8 space-y-4">
      <p className="text-[10px] tracking-[0.22em] font-mono text-muted">ORDERS</p>
      <h2 className="text-2xl font-display tracking-[0.08em]">Order history</h2>
      {(orders ?? []).length === 0 ? (
        <>
          <p className="text-sm text-muted max-w-md">No orders yet.</p>
          <Link href="/shop"><Button variant="secondary">BROWSE INVENTORY</Button></Link>
        </>
      ) : (
        <ul className="space-y-4">
          {(orders ?? []).map((order) => {
            const purchased = PURCHASED_ORDER_STATUSES.includes(order.status as (typeof PURCHASED_ORDER_STATUSES)[number]);
            return (
              <li key={order.id} className="border border-border rounded-md p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="font-mono">{order.order_number}</p>
                    <p className="text-xs text-muted capitalize">{order.status} · {order.payment_status}</p>
                  </div>
                  <p className="font-mono">{formatPrice(Number(order.total))}</p>
                </div>
                <ul className="space-y-2">
                  {(itemsByOrder.get(order.id) ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-sm">
                      <span>
                        {item.name} · {item.size}
                      </span>
                      {purchased && item.product_id && (
                        reviewed.has(item.product_id) ? (
                          <Link href="/account/reviews" className="text-[10px] tracking-[0.16em] font-mono text-muted">
                            REVIEWED
                          </Link>
                        ) : (
                          <Link
                            href={`/account/reviews/write?product=${item.product_id}&order=${order.id}&item=${item.id}`}
                            className="text-[10px] tracking-[0.16em] font-mono text-accent-secondary"
                          >
                            LEAVE A REVIEW
                          </Link>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
