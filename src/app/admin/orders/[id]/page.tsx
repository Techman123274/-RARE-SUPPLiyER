import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "../../actions";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/database.types";

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders.write");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">{order.order_number}</h1>
        <p className="text-sm text-[#8b93a5]">{order.email} · {new Date(order.created_at).toLocaleString()}</p>
      </div>
      <form
        action={async (formData) => {
          "use server";
          await updateOrderStatus(id, String(formData.get("status")) as OrderStatus);
        }}
        className="flex gap-2 items-center"
      >
        <select name="status" defaultValue={order.status} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="px-3 py-2 bg-white text-black rounded-md text-sm">Update status</button>
      </form>
      <div className="rounded-lg border border-white/10 divide-y divide-white/5">
        {(items ?? []).map((item) => (
          <div key={item.id} className="p-3 flex justify-between text-sm">
            <span>{item.name} · {item.size} × {item.quantity}</span>
            <span className="font-mono">{formatPrice(Number(item.line_total))}</span>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm max-w-sm">
        <dt className="text-[#8b93a5]">Subtotal</dt><dd className="font-mono">{formatPrice(Number(order.subtotal))}</dd>
        <dt className="text-[#8b93a5]">Discount</dt><dd className="font-mono">{formatPrice(Number(order.discount))}</dd>
        <dt className="text-[#8b93a5]">Shipping</dt><dd className="font-mono">{formatPrice(Number(order.shipping))}</dd>
        <dt className="text-[#8b93a5]">Total</dt><dd className="font-mono">{formatPrice(Number(order.total))}</dd>
      </dl>
    </div>
  );
}
