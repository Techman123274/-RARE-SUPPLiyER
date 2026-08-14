import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadStaffProducts } from "@/lib/store/admin-data";
import { saveDealAction } from "../actions";

export const metadata = { title: "Deals — Admin" };

export default async function DealsPage() {
  await requireStaff("marketing.write");
  const supabase = await createServerSupabaseClient();
  const { data: deals } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
  const products = await loadStaffProducts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Deals</h1>
      <form action={saveDealAction} className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-2 gap-3">
        <input name="name" placeholder="Deal name" required className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="description" placeholder="Description" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <select name="discount_type" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          <option value="percent">Percent</option>
          <option value="fixed">Fixed amount</option>
          <option value="free_shipping">Free shipping</option>
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="starts_at" type="datetime-local" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="ends_at" type="datetime-local" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <label className="sm:col-span-2 text-xs text-[#8b93a5]">
          Product IDs (comma separated)
          <input name="product_ids" placeholder={products.slice(0, 3).map((p) => p.id).join(",")} className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        </label>
        <button className="bg-white text-black rounded-md text-sm py-2">Create deal</button>
      </form>
      {(deals ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No deals yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {(deals ?? []).map((d) => (
            <li key={d.id} className="border border-white/10 rounded-md p-3">
              <p>{d.name}</p>
              <p className="text-xs text-[#8b93a5]">{d.discount_type} {d.amount} · {d.active ? "active" : "inactive"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
