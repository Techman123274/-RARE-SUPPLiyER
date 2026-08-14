import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "Orders — Admin" };

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff("orders.write");
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status && STATUSES.includes(status as OrderStatus)) {
    query = query.eq("status", status as OrderStatus);
  }
  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Orders</h1>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/admin/orders" className="px-3 py-1.5 border border-white/10 rounded-md">All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className="px-3 py-1.5 border border-white/10 rounded-md capitalize">{s}</Link>
        ))}
      </div>
      {(orders ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Total</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="border-t border-white/5">
                  <td className="p-3">
                    <Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                  </td>
                  <td className="p-3">{order.email}</td>
                  <td className="p-3 capitalize">{order.status}</td>
                  <td className="p-3">{order.payment_status}</td>
                  <td className="p-3 font-mono">{formatPrice(Number(order.total))}</td>
                  <td className="p-3 text-[#8b93a5]">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
