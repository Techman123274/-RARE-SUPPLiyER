import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canCancelRequest, formatBudget, REQUEST_STATUS_LABELS } from "@/lib/store/requests";
import { productHref } from "@/lib/utils";
import { CancelRequestButton } from "@/components/requests/CancelRequestButton";
import type { ItemRequestStatus } from "@/lib/supabase/database.types";

export default async function AccountRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: request } = await supabase
    .from("item_requests")
    .select(
      "id, product_name, brand, category, size, color, condition_preference, budget_min, budget_max, budget_text, details, status, admin_response, linked_product_id, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) notFound();

  const status = request.status as ItemRequestStatus;
  let linked: { id: string; slug: string; name: string } | null = null;
  if (request.linked_product_id) {
    const { data } = await supabase
      .from("products")
      .select("id, slug, name")
      .eq("id", request.linked_product_id)
      .maybeSingle();
    linked = data;
  }

  const found = status === "found" || status === "available";

  return (
    <div className="glass p-6 sm:p-8 space-y-6">
      <div>
        <Link href="/account/requests" className="text-xs text-muted hover:text-foreground">
          ← MY REQUESTS
        </Link>
        <p className="text-[10px] tracking-[0.22em] font-mono text-accent-secondary mt-4">
          {REQUEST_STATUS_LABELS[status]}
        </p>
        <h2 className="text-2xl font-display tracking-wide mt-2">{request.product_name}</h2>
      </div>

      {found && (
        <div className="rounded-lg border border-accent-secondary/30 bg-accent-secondary/10 p-5 space-y-2">
          <p className="text-[10px] tracking-[0.22em] font-mono text-accent-secondary">WE FOUND IT</p>
          <p className="text-sm">
            {status === "available"
              ? "The item you requested is now available. It is not reserved for you."
              : "We found a possible match for the item you requested."}
          </p>
          {linked && (
            <Link href={productHref(linked)}>
              <Button size="sm">VIEW PRODUCT</Button>
            </Link>
          )}
        </div>
      )}

      <dl className="grid sm:grid-cols-2 gap-4 text-sm">
        <Item label="Brand" value={request.brand || "—"} />
        <Item label="Category" value={request.category} />
        <Item label="Size" value={request.size || "—"} />
        <Item label="Color" value={request.color || "—"} />
        <Item label="Condition" value={request.condition_preference} />
        <Item label="Budget" value={formatBudget(request.budget_min, request.budget_max, request.budget_text)} />
        <Item label="Submitted" value={new Date(request.created_at).toLocaleString()} />
        <Item label="Updated" value={new Date(request.updated_at).toLocaleString()} />
      </dl>

      {request.details && (
        <div>
          <p className="text-[10px] tracking-[0.2em] font-mono text-muted mb-2">ADDITIONAL DETAILS</p>
          <p className="text-sm text-muted whitespace-pre-wrap">{request.details}</p>
        </div>
      )}

      {request.admin_response && (
        <div className="rounded-md border border-border p-4">
          <p className="text-[10px] tracking-[0.2em] font-mono text-muted mb-2">UPDATE</p>
          <p className="text-sm whitespace-pre-wrap">{request.admin_response}</p>
        </div>
      )}

      {canCancelRequest(status) && <CancelRequestButton requestId={request.id} />}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.16em] font-mono text-muted mb-1">{label.toUpperCase()}</dt>
      <dd>{value}</dd>
    </div>
  );
}
