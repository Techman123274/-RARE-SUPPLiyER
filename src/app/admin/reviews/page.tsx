import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { REVIEW_STATUS_LABELS, REVIEW_STATUSES, starsLabel } from "@/lib/store/reviews";
import { resolveReportAction } from "../request-review-actions";
import type { ReviewStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reported?: string }>;
}) {
  await requireStaff("reviews.moderate");
  const { status, reported } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const [{ data: statsRows }, { data: reviews }, { data: reports }] = await Promise.all([
    supabase.rpc("staff_review_stats"),
    supabase.from("reviews").select("*").eq("archived", false).order("created_at", { ascending: false }),
    supabase.from("review_reports").select("*").eq("resolved", false).order("created_at", { ascending: false }),
  ]);
  const stats = statsRows?.[0];

  let list = reviews ?? [];
  if (status && REVIEW_STATUSES.includes(status as ReviewStatus)) {
    list = list.filter((r) => r.status === status);
  }
  if (reported === "1") {
    const reportedIds = new Set((reports ?? []).map((r) => r.review_id));
    list = list.filter((r) => reportedIds.has(r.id));
  }

  const productIds = [...new Set(list.map((r) => r.product_id))];
  const userIds = [...new Set(list.map((r) => r.user_id))];
  const [{ data: products }, { data: profiles }] = await Promise.all([
    productIds.length ? supabase.from("products").select("id, name, slug").in("id", productIds) : { data: [] },
    userIds.length ? supabase.from("profiles").select("id, email, display_name").in("id", userIds) : { data: [] },
  ]);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const counts = {
    pending: (reviews ?? []).filter((r) => r.status === "pending").length,
    approved: (reviews ?? []).filter((r) => r.status === "approved").length,
    rejected: (reviews ?? []).filter((r) => r.status === "rejected").length,
    hidden: (reviews ?? []).filter((r) => r.status === "hidden").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Reviews</h1>
        <p className="text-sm text-[#8b93a5] mt-1">Moderate customer reviews before they appear on the storefront.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Rejected" value={counts.rejected} />
        <Stat label="Hidden" value={counts.hidden} />
        <Stat label="Average rating" value={stats?.average_rating != null ? String(stats.average_rating) : "—"} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/admin/reviews" className="px-3 py-1.5 border border-white/10 rounded-md">All</Link>
        <Link href="/admin/reviews?status=pending" className="px-3 py-1.5 border border-white/10 rounded-md">Pending</Link>
        <Link href="/admin/reviews?status=approved" className="px-3 py-1.5 border border-white/10 rounded-md">Approved</Link>
        <Link href="/admin/reviews?reported=1" className="px-3 py-1.5 border border-white/10 rounded-md">Reported</Link>
      </div>

      {(reports ?? []).length > 0 && (
        <section className="rounded-lg border border-amber-400/20 p-4 space-y-2">
          <h2 className="text-sm font-medium">Open reports</h2>
          {(reports ?? []).map((report) => (
            <form key={report.id} action={resolveReportAction} className="flex justify-between gap-3 text-sm border-b border-white/5 py-2">
              <input type="hidden" name="id" value={report.id} />
              <span>
                {report.reason} · <Link href={`/admin/reviews/${report.review_id}`}>Open review</Link>
              </span>
              <button className="text-xs text-[#8b93a5]">Resolve</button>
            </form>
          ))}
        </section>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No reviews in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map((review) => {
                const product = productMap.get(review.product_id);
                const customer = profileMap.get(review.user_id);
                return (
                  <tr key={review.id} className="border-t border-white/5">
                    <td className="p-3">
                      <Link href={`/admin/reviews/${review.id}`}>{product?.name ?? "Product"}</Link>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/customers/${review.user_id}`}>{customer?.display_name || customer?.email}</Link>
                    </td>
                    <td className="p-3">{starsLabel(review.rating)}</td>
                    <td className="p-3">{REVIEW_STATUS_LABELS[review.status]}</td>
                    <td className="p-3">{review.verified_purchase ? "Yes" : "No"}</td>
                    <td className="p-3 text-[#8b93a5]">{new Date(review.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#161821] p-4">
      <p className="text-xs text-[#8b93a5] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-mono mt-2">{value}</p>
    </div>
  );
}
