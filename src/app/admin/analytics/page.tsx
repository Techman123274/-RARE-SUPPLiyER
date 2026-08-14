import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { REQUEST_STATUS_LABELS } from "@/lib/store/requests";

export const metadata = { title: "Analytics — Admin" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireStaff("analytics.read");
  const { view } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [{ data: orders }, { data: reviewStatsRows }, { data: requests }, { data: reviews }] = await Promise.all([
    supabase.from("orders").select("total, status, created_at, user_id"),
    supabase.rpc("staff_review_stats"),
    supabase.rpc("staff_item_requests"),
    supabase.from("reviews").select("product_id, rating, status, archived").eq("status", "approved").eq("archived", false),
  ]);

  const paid = (orders ?? []).filter((o) => !["cancelled", "refunded"].includes(o.status));
  const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);
  const customers = new Set(paid.map((o) => o.user_id).filter(Boolean)).size;
  const stats = reviewStatsRows?.[0];

  const byProduct = new Map<string, { sum: number; count: number }>();
  for (const review of reviews ?? []) {
    const current = byProduct.get(review.product_id) ?? { sum: 0, count: 0 };
    current.sum += review.rating;
    current.count += 1;
    byProduct.set(review.product_id, current);
  }
  const ranked = [...byProduct.entries()]
    .map(([id, v]) => ({ id, avg: v.sum / v.count, count: v.count }))
    .filter((p) => p.count >= 1)
    .sort((a, b) => b.avg - a.avg);
  const productIds = ranked.map((p) => p.id);
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const names = new Map((products ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Analytics</h1>
        <p className="text-sm text-[#8b93a5]">Built from real store data only. Nothing is fabricated.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/admin/analytics" className="px-3 py-1.5 border border-white/10 rounded-md">Sales</Link>
        <Link href="/admin/analytics?view=reviews" className="px-3 py-1.5 border border-white/10 rounded-md">Reviews</Link>
        <Link href="/admin/analytics?view=requests" className="px-3 py-1.5 border border-white/10 rounded-md">Requests</Link>
      </div>

      {view === "reviews" ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Card label="Average rating" value={stats?.average_rating != null ? String(stats.average_rating) : "—"} />
            <Card label="Total reviews" value={String(stats?.total_reviews ?? 0)} />
            <Card label="Pending reviews" value={String(stats?.pending_reviews ?? 0)} />
            <Card label="Reviews this month" value={String(stats?.reviews_this_month ?? 0)} />
            <Card label="Reported reviews" value={String(stats?.reported_reviews ?? 0)} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Rank title="Highest ratings" rows={ranked.slice(0, 5)} names={names} />
            <Rank title="Lowest ratings" rows={[...ranked].reverse().slice(0, 5)} names={names} />
          </div>
        </div>
      ) : view === "requests" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(["submitted", "under_review", "looking", "found", "available", "unable_to_source", "cancelled"] as const).map((status) => (
            <Card
              key={status}
              label={REQUEST_STATUS_LABELS[status]}
              value={String((requests ?? []).filter((r) => r.status === status).length)}
            />
          ))}
          <Card label="Total requests" value={String((requests ?? []).length)} />
        </div>
      ) : (orders ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No orders yet, so there is nothing to chart.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          <Card label="Revenue" value={formatPrice(revenue)} />
          <Card label="Orders" value={String(paid.length)} />
          <Card label="Customers with orders" value={String(customers)} />
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-xs text-[#8b93a5]">{label}</p>
      <p className="text-2xl font-mono mt-2">{value}</p>
    </div>
  );
}

function Rank({
  title,
  rows,
  names,
}: {
  title: string;
  rows: { id: string; avg: number; count: number }[];
  names: Map<string, string>;
}) {
  return (
    <section className="rounded-lg border border-white/10 p-4">
      <h2 className="text-sm font-medium mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#8b93a5]">Not enough approved reviews yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3">
              <span>{names.get(row.id) ?? "Product"}</span>
              <span className="font-mono text-[#8b93a5]">{row.avg.toFixed(1)} · {row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
