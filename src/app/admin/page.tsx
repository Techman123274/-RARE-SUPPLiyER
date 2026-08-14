import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadStaffProducts, loadProductExtras } from "@/lib/store/admin-data";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard — Admin" };

export default async function AdminDashboardPage() {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [products, ordersRes, customersRes, activityRes, requestsRes, reviewStatsRes] = await Promise.all([
    loadStaffProducts(),
    supabase.from("orders").select("id, order_number, email, total, status, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("admin_activity").select("id, summary, created_at, action").order("created_at", { ascending: false }).limit(8),
    supabase.rpc("staff_item_requests"),
    supabase.rpc("staff_review_stats"),
  ]);

  const extras = await loadProductExtras(products.map((p) => p.id));
  const stockByProduct = new Map<string, number>();
  for (const size of extras.sizes) {
    stockByProduct.set(size.product_id, (stockByProduct.get(size.product_id) ?? 0) + size.quantity);
  }

  const todayOrders = (ordersRes.data ?? []).filter((o) => new Date(o.created_at) >= start);
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const lowStock = products.filter((p) => (stockByProduct.get(p.id) ?? 0) > 0 && (stockByProduct.get(p.id) ?? 0) <= 2).slice(0, 6);

  const reviewStats = reviewStatsRes.data?.[0];
  const newRequests = (requestsRes.data ?? []).filter((r) => r.status === "submitted").length;

  const stats = [
    { label: "Today sales", value: formatPrice(todaySales) },
    { label: "Today orders", value: String(todayOrders.length) },
    { label: "Customers", value: String(customersRes.count ?? 0) },
    { label: "Live products", value: String(products.filter((p) => p.status === "active").length) },
    { label: "New requests", value: String(newRequests) },
    { label: "Pending reviews", value: String(reviewStats?.pending_reviews ?? 0) },
    { label: "Avg rating", value: reviewStats?.average_rating != null ? String(reviewStats.average_rating) : "—" },
    { label: "Reported reviews", value: String(reviewStats?.reported_reviews ?? 0) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-[#8b93a5] mt-1">Store operations. Empty until real orders exist.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-[#161821] p-4">
            <p className="text-xs text-[#8b93a5] uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-mono mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-white/10 bg-[#161821] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-[#4da3ff]">View all</Link>
        </div>
        {(ordersRes.data ?? []).length === 0 ? (
          <p className="text-sm text-[#8b93a5]">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {(ordersRes.data ?? []).map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex justify-between text-sm border-b border-white/5 py-2">
                <span>{order.order_number}</span>
                <span className="text-[#8b93a5]">{order.status}</span>
                <span className="font-mono">{formatPrice(Number(order.total))}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-white/10 bg-[#161821] p-5">
          <h2 className="text-sm font-medium mb-4">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#8b93a5]">No low-stock products.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-white">{p.name}</Link>
                  <span className="text-amber-300 font-mono">{stockByProduct.get(p.id)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-white/10 bg-[#161821] p-5">
          <h2 className="text-sm font-medium mb-4">Activity</h2>
          {(activityRes.data ?? []).length === 0 ? (
            <p className="text-sm text-[#8b93a5]">No admin activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(activityRes.data ?? []).map((row) => (
                <li key={row.id} className="text-[#c5cad6]">
                  {row.summary}
                  <span className="block text-[11px] text-[#8b93a5]">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
