import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasCapability, isStaffRole, type StaffCapability } from "@/lib/store/roles";
import { loadProfileRow, restoreOwnerAdmin } from "@/lib/store/ensure-owner";
import type { AppRole, Profile } from "@/lib/supabase/database.types";
import type { User } from "@supabase/supabase-js";

export async function getStaffContext(): Promise<{
  user: User;
  profile: Profile;
  role: AppRole;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await restoreOwnerAdmin(supabase);

  const { data: isStaff } = await supabase.rpc("is_staff");
  const { profile, unavailable } = await loadProfileRow(supabase, user.id);
  if (unavailable || !profile || !profile.is_active || !isStaffRole(profile.role)) return null;
  if (!isStaff && profile.role !== "admin") return null;
  return { user, profile, role: profile.role };
}

export async function requireStaff(capability?: StaffCapability) {
  const ctx = await getStaffContext();
  if (!ctx) redirect("/admin/login");
  if (capability && !hasCapability(ctx.role, capability)) {
    redirect("/admin?error=forbidden");
  }
  return ctx;
}
