import { AdminShell } from "@/components/admin/AdminShell";
import { getStaffContext } from "@/lib/store/require-staff";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaffContext();
  if (!staff) return <>{children}</>;

  return (
    <AdminShell role={staff.role} email={staff.profile.email || staff.user.email || ""}>
      {children}
    </AdminShell>
  );
}
