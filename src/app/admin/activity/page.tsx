import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Activity — Admin" };

export default async function ActivityPage() {
  await requireStaff();
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from("admin_activity").select("*").order("created_at", { ascending: false }).limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Admin activity</h1>
      {(rows ?? []).length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No admin activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {(rows ?? []).map((row) => (
            <li key={row.id} className="border-b border-white/5 pb-3 text-sm">
              <p>{row.summary}</p>
              <p className="text-[11px] text-[#8b93a5]">{row.action} · {new Date(row.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
