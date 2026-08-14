import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  formatBudget,
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUSES,
} from "@/lib/store/requests";
import type { ItemRequestPriority, ItemRequestStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "Requests — Admin" };

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    brand?: string;
    size?: string;
    customer?: string;
    priority?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireStaff("requests.write");
  const filters = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.rpc("staff_item_requests");
  let list = rows ?? [];

  if (filters.status && REQUEST_STATUSES.includes(filters.status as ItemRequestStatus)) {
    list = list.filter((r) => r.status === filters.status);
  }
  if (filters.category) list = list.filter((r) => r.category === filters.category);
  if (filters.brand) {
    const q = filters.brand.toLowerCase();
    list = list.filter((r) => r.brand.toLowerCase().includes(q));
  }
  if (filters.size) list = list.filter((r) => (r.size ?? "").toLowerCase().includes(filters.size!.toLowerCase()));
  if (filters.priority && REQUEST_PRIORITIES.includes(filters.priority as ItemRequestPriority)) {
    list = list.filter((r) => r.priority === filters.priority);
  }
  if (filters.from) list = list.filter((r) => r.created_at >= filters.from!);
  if (filters.to) list = list.filter((r) => r.created_at <= `${filters.to}T23:59:59`);

  const userIds = [...new Set(list.map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, display_name").in("id", userIds)
    : { data: [] };
  const customers = new Map((profiles ?? []).map((p) => [p.id, p]));

  if (filters.customer) {
    const q = filters.customer.toLowerCase();
    list = list.filter((r) => {
      const c = customers.get(r.user_id);
      return (c?.email ?? "").toLowerCase().includes(q) || (c?.display_name ?? "").toLowerCase().includes(q);
    });
  }

  const counts = {
    total: (rows ?? []).length,
    submitted: (rows ?? []).filter((r) => r.status === "submitted").length,
    under_review: (rows ?? []).filter((r) => r.status === "under_review").length,
    looking: (rows ?? []).filter((r) => r.status === "looking").length,
    found: (rows ?? []).filter((r) => r.status === "found").length,
    available: (rows ?? []).filter((r) => r.status === "available").length,
    unable: (rows ?? []).filter((r) => r.status === "unable_to_source").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Requests</h1>
        <p className="text-sm text-[#8b93a5] mt-1">
          Customer sourcing requests — not orders, not preorders, not reservations.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <Stat label="Total Requests" value={counts.total} />
        <Stat label="New Requests" value={counts.submitted} />
        <Stat label="Under Review" value={counts.under_review} />
        <Stat label="Looking" value={counts.looking} />
        <Stat label="Found" value={counts.found} />
        <Stat label="Completed" value={counts.available} />
        <Stat label="Unable to Source" value={counts.unable} />
      </div>

      <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 rounded-lg border border-white/10 p-4">
        <select name="status" defaultValue={filters.status ?? ""} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select name="category" defaultValue={filters.category ?? ""} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          <option value="">All categories</option>
          {REQUEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          <option value="">All priorities</option>
          {REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>{REQUEST_PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <input name="brand" defaultValue={filters.brand} placeholder="Brand" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="size" defaultValue={filters.size} placeholder="Size" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="customer" defaultValue={filters.customer} placeholder="Customer" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input type="date" name="from" defaultValue={filters.from} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <button className="px-3 py-2 bg-white text-black rounded-md text-sm">Filter</button>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No requests match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Requested item</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Category</th>
                <th className="p-3">Size</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const customer = customers.get(row.user_id);
                return (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="p-3">
                      <Link href={`/admin/customers/${row.user_id}`}>{customer?.display_name || customer?.email || "Customer"}</Link>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/requests/${row.id}`}>{row.product_name}</Link>
                    </td>
                    <td className="p-3">{row.brand || "—"}</td>
                    <td className="p-3">{row.category}</td>
                    <td className="p-3">{row.size || "—"}</td>
                    <td className="p-3">{formatBudget(row.budget_min, row.budget_max, row.budget_text)}</td>
                    <td className="p-3 text-[#8b93a5]">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{REQUEST_STATUS_LABELS[row.status]}</td>
                    <td className="p-3">{REQUEST_PRIORITY_LABELS[row.priority]}</td>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#161821] p-4">
      <p className="text-xs text-[#8b93a5] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-mono mt-2">{value}</p>
    </div>
  );
}
