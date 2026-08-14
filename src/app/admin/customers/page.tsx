import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Customers — Admin" };

export default async function CustomersPage() {
  await requireStaff("customers.read");
  const supabase = await createServerSupabaseClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at, is_active")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: orders } = ids.length
    ? await supabase.from("orders").select("user_id, total, created_at").in("user_id", ids)
    : { data: [] as { user_id: string | null; total: number; created_at: string }[] };

  const stats = new Map<string, { count: number; spent: number; last?: string }>();
  for (const order of orders ?? []) {
    if (!order.user_id) continue;
    const current = stats.get(order.user_id) ?? { count: 0, spent: 0 };
    current.count += 1;
    current.spent += Number(order.total);
    if (!current.last || order.created_at > current.last) current.last = order.created_at;
    stats.set(order.user_id, current);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Customers</h1>
      {(profiles ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No customer accounts yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Spent</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => {
                const s = stats.get(p.id);
                return (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="p-3">
                      <Link href={`/admin/customers/${p.id}`}>{p.display_name || p.email}</Link>
                      <div className="text-[11px] text-[#8b93a5]">{p.email}</div>
                    </td>
                    <td className="p-3">{s?.count ?? 0}</td>
                    <td className="p-3 font-mono">{formatPrice(s?.spent ?? 0)}</td>
                    <td className="p-3 text-[#8b93a5]">{new Date(p.created_at).toLocaleDateString()}</td>
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
