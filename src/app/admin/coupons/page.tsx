import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { archiveCouponAction, disableCouponAction, saveCouponAction } from "../actions";

export const metadata = { title: "Coupons — Admin" };

export default async function CouponsPage() {
  await requireStaff("marketing.write");
  const supabase = await createServerSupabaseClient();
  const { data: coupons } = await supabase.from("coupons").select("*").eq("archived", false).order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Coupons</h1>
      <form action={saveCouponAction} className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input name="code" placeholder="CODE" required className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="title" placeholder="Title" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <select name="discount_type" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          <option value="percent">Percent</option>
          <option value="fixed">Fixed amount</option>
          <option value="free_shipping">Free shipping</option>
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="min_order" type="number" step="0.01" placeholder="Min order" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="expires_at" type="datetime-local" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="max_uses" type="number" placeholder="Max uses" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <button className="bg-white text-black rounded-md text-sm">Create coupon</button>
      </form>
      {(coupons ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No coupons yet.</p>
      ) : (
        <div className="space-y-2">
          {(coupons ?? []).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border border-white/10 rounded-md p-3 text-sm">
              <div>
                <p className="font-mono">{c.code}</p>
                <p className="text-xs text-[#8b93a5]">{c.title} · {c.discount_type} {c.amount} · used {c.usage_count}{c.max_uses ? `/${c.max_uses}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <form action={disableCouponAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-xs border border-white/10 rounded-md px-3 py-1.5">{c.active ? "Disable" : "Disabled"}</button>
                </form>
                <form action={archiveCouponAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-xs text-red-300">Archive</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
