import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("customers.read");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!profile) notFound();
  const { data: orders } = await supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false });
  const { data: wishlist } = await supabase.from("wishlists").select("product_id, created_at").eq("user_id", id);
  const { data: requests } = await supabase.rpc("staff_item_requests");
  const customerRequests = (requests ?? []).filter((r) => r.user_id === id);
  const spent = (orders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">{profile.display_name || profile.email}</h1>
        <p className="text-sm text-[#8b93a5]">{profile.email}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Orders" value={String(orders?.length ?? 0)} />
        <Stat label="Total spent" value={formatPrice(spent)} />
        <Stat label="Wishlist" value={String(wishlist?.length ?? 0)} />
        <Stat label="Requests" value={String(customerRequests.length)} />
      </div>
      <section>
        <h2 className="text-sm font-medium mb-3">Orders</h2>
        {(orders ?? []).length === 0 ? (
          <p className="text-sm text-[#8b93a5]">No orders yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(orders ?? []).map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                <span className="text-[#8b93a5]"> · {order.status} · {formatPrice(Number(order.total))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-sm font-medium mb-3">Requests</h2>
        {customerRequests.length === 0 ? (
          <p className="text-sm text-[#8b93a5]">No item requests.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {customerRequests.map((request) => (
              <li key={request.id}>
                <Link href={`/admin/requests/${request.id}`}>{request.product_name}</Link>
                <span className="text-[#8b93a5]"> · {request.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-xs text-[#8b93a5]">{label}</p>
      <p className="text-xl font-mono mt-1">{value}</p>
    </div>
  );
}
