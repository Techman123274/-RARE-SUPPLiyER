import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateStaffRole } from "../actions";
import type { AppRole } from "@/lib/supabase/database.types";

export const metadata = { title: "Admin users — Admin" };

const ROLES: AppRole[] = ["admin", "manager", "inventory_manager", "order_manager", "marketing_manager", "customer"];

export default async function AdminUsersPage() {
  await requireStaff("admins.write");
  const supabase = await createServerSupabaseClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Admin users</h1>
        <p className="text-sm text-[#8b93a5]">Customers cannot promote themselves. Only an existing admin can change roles.</p>
      </div>
      <div className="space-y-3">
        {(profiles ?? []).map((p) => (
          <form
            key={p.id}
            action={async (formData) => {
              "use server";
              await updateStaffRole(p.id, String(formData.get("role")) as AppRole, formData.get("is_active") === "on");
            }}
            className="flex flex-wrap items-center gap-2 border border-white/10 rounded-md p-3 text-sm"
          >
            <div className="min-w-[180px]">
              <p>{p.display_name || p.email}</p>
              <p className="text-[11px] text-[#8b93a5]">{p.email}</p>
            </div>
            <select name="role" defaultValue={p.role} className="bg-[#0c0d12] border border-white/10 rounded-md px-2 py-1.5">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" name="is_active" defaultChecked={p.is_active} /> Active
            </label>
            <button className="text-xs border border-white/10 rounded-md px-3 py-1.5">Save</button>
          </form>
        ))}
      </div>
    </div>
  );
}
