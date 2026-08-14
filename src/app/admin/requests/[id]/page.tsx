import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateItemRequestAction, addRequestNoteAction } from "../../request-review-actions";
import {
  formatBudget,
  REQUEST_PRIORITY_LABELS,
  REQUEST_PRIORITIES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUSES,
} from "@/lib/store/requests";
import { loadStaffProducts } from "@/lib/store/admin-data";

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("requests.write");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.rpc("staff_item_requests");
  const request = (rows ?? []).find((r) => r.id === id);
  if (!request) notFound();

  const [{ data: profile }, { data: notes }, products] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name").eq("id", request.user_id).maybeSingle(),
    supabase.from("item_request_notes").select("*").eq("request_id", id).order("created_at", { ascending: false }),
    loadStaffProducts(),
  ]);

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .neq("role", "customer")
    .eq("is_active", true);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/requests" className="text-xs text-[#8b93a5]">← Requests</Link>
        <h1 className="text-2xl font-medium mt-2">{request.product_name}</h1>
        <p className="text-sm text-[#8b93a5]">
          {profile?.display_name || profile?.email} · {new Date(request.created_at).toLocaleString()}
        </p>
      </div>

      <dl className="grid sm:grid-cols-2 gap-3 text-sm rounded-lg border border-white/10 p-4">
        <Row label="Customer" value={profile?.email ?? "—"} />
        <Row label="Brand" value={request.brand || "—"} />
        <Row label="Category" value={request.category} />
        <Row label="Size" value={request.size || "—"} />
        <Row label="Color" value={request.color || "—"} />
        <Row label="Condition" value={request.condition_preference} />
        <Row label="Budget" value={formatBudget(request.budget_min, request.budget_max, request.budget_text)} />
        <Row label="Updated" value={new Date(request.updated_at).toLocaleString()} />
      </dl>
      {request.details && (
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs text-[#8b93a5] mb-2">Customer details</p>
          <p className="text-sm whitespace-pre-wrap">{request.details}</p>
        </div>
      )}

      <form action={updateItemRequestAction} className="space-y-3 rounded-lg border border-white/10 p-4">
        <input type="hidden" name="id" value={request.id} />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-[#8b93a5] block">
            Status
            <select name="status" defaultValue={request.status} className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white">
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#8b93a5] block">
            Priority (internal)
            <select name="priority" defaultValue={request.priority} className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white">
              {REQUEST_PRIORITIES.map((p) => (
                <option key={p} value={p}>{REQUEST_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#8b93a5] block">
            Assign to
            <select name="assigned_to" defaultValue={request.assigned_to ?? ""} className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white">
              <option value="">Unassigned</option>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.display_name || s.email}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#8b93a5] block">
            Link product
            <select name="linked_product_id" defaultValue={request.linked_product_id ?? ""} className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white">
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-xs text-[#8b93a5] block">
          Customer-facing update
          <textarea
            name="admin_response"
            rows={4}
            defaultValue={request.admin_response ?? ""}
            placeholder="We're currently looking for this item in your requested size."
            className="mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white"
          />
        </label>
        <p className="text-[11px] text-[#8b93a5]">
          Linking a product does not reserve it. Set status to FOUND or AVAILABLE when you want the customer notified.
        </p>
        <button className="px-4 py-2 bg-white text-black rounded-md text-sm">Save</button>
      </form>

      <section className="rounded-lg border border-white/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Internal notes</h2>
        <p className="text-[11px] text-[#8b93a5]">Never visible to customers.</p>
        <form action={addRequestNoteAction} className="space-y-2">
          <input type="hidden" name="request_id" value={request.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Found a possible pair through local supplier. Waiting for photos."
            className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm"
          />
          <button className="px-3 py-2 border border-white/10 rounded-md text-sm">Add internal note</button>
        </form>
        <ul className="space-y-2 text-sm">
          {(notes ?? []).map((note) => (
            <li key={note.id} className="border-t border-white/5 pt-2">
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="text-[11px] text-[#8b93a5] mt-1">{new Date(note.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#8b93a5]">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
