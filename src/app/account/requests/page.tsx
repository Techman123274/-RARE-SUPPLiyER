import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { REQUEST_STATUS_LABELS, formatBudget } from "@/lib/store/requests";
import type { ItemRequestStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "My Requests — RARE SUPPLiyER" };

export default async function AccountRequestsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="glass p-6 sm:p-8 space-y-4">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">MY REQUESTS</p>
        <h2 className="text-2xl font-display tracking-wide">Item requests</h2>
        <p className="text-sm text-muted">Requests will show here once the store database is connected.</p>
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: requests } = user
    ? await supabase
        .from("item_requests")
        .select(
          "id, product_name, brand, category, status, created_at, updated_at, budget_min, budget_max, budget_text"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="glass p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] font-mono text-muted">MY REQUESTS</p>
          <h2 className="text-2xl font-display tracking-wide mt-1">Item requests</h2>
          <p className="text-sm text-muted mt-2">
            These are sourcing requests, not orders. We may or may not be able to find the item.
          </p>
        </div>
        <Link href="/request">
          <Button size="sm">REQUEST AN ITEM</Button>
        </Link>
      </div>

      {(requests ?? []).length === 0 ? (
        <p className="text-sm text-muted">You haven&apos;t submitted any requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {(requests ?? []).map((request) => (
            <li key={request.id}>
              <Link
                href={`/account/requests/${request.id}`}
                className="block border border-border rounded-md p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{request.product_name}</p>
                    <p className="text-xs text-muted mt-1">
                      {request.brand || "No brand"} · {request.category} ·{" "}
                      {formatBudget(request.budget_min, request.budget_max, request.budget_text)}
                    </p>
                  </div>
                  <p className="text-[10px] tracking-[0.16em] font-mono text-accent-secondary whitespace-nowrap">
                    {REQUEST_STATUS_LABELS[request.status as ItemRequestStatus] ?? request.status}
                  </p>
                </div>
                <p className="text-[11px] text-muted mt-3">
                  Submitted {new Date(request.created_at).toLocaleDateString()} · Last update{" "}
                  {new Date(request.updated_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
