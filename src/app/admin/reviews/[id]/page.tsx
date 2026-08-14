import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderateReviewAction, moderateReviewImageAction, resolveReportAction } from "../../request-review-actions";
import { REVIEW_STATUS_LABELS, REVIEW_STATUSES, starsLabel } from "@/lib/store/reviews";
import { reviewImageUrl } from "@/lib/store/media";
import { productHref } from "@/lib/utils";

export default async function AdminReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("reviews.moderate");
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: review } = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
  if (!review) notFound();

  const [{ data: product }, { data: profile }, { data: images }, { data: reports }, { data: order }] = await Promise.all([
    supabase.from("products").select("id, name, slug, sku").eq("id", review.product_id).maybeSingle(),
    supabase.from("profiles").select("id, email, display_name").eq("id", review.user_id).maybeSingle(),
    supabase.from("review_images").select("*").eq("review_id", id).order("created_at"),
    supabase.from("review_reports").select("*").eq("review_id", id).order("created_at", { ascending: false }),
    review.order_id
      ? supabase.from("orders").select("id, order_number, status").eq("id", review.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/reviews" className="text-xs text-[#8b93a5]">← Reviews</Link>
        <h1 className="text-2xl font-medium mt-2">{review.title}</h1>
        <p className="text-sm text-[#8b93a5]">{starsLabel(review.rating)} · {REVIEW_STATUS_LABELS[review.status]}</p>
      </div>

      <dl className="grid sm:grid-cols-2 gap-3 text-sm rounded-lg border border-white/10 p-4">
        <div>
          <dt className="text-xs text-[#8b93a5]">Product</dt>
          <dd className="mt-1">
            {product ? <Link href={`/admin/products/${product.id}`}>{product.name}</Link> : "—"}
            {product && (
              <Link href={productHref(product)} className="block text-[11px] text-[#8b93a5]" target="_blank">
                View on storefront
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#8b93a5]">Customer</dt>
          <dd className="mt-1">
            <Link href={`/admin/customers/${review.user_id}`}>{profile?.display_name || profile?.email}</Link>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#8b93a5]">Verified purchase</dt>
          <dd className="mt-1">{review.verified_purchase ? "Yes — from order data" : "No"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#8b93a5]">Order</dt>
          <dd className="mt-1">
            {order ? <Link href={`/admin/orders/${order.id}`}>{order.order_number} · {order.status}</Link> : "Not linked"}
          </dd>
        </div>
      </dl>

      <div className="rounded-lg border border-white/10 p-4">
        <p className="text-sm whitespace-pre-wrap">{review.body}</p>
      </div>

      <form action={moderateReviewAction} className="flex flex-wrap gap-2 items-center">
        <input type="hidden" name="id" value={review.id} />
        <select name="status" defaultValue={review.status} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
          {REVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>{REVIEW_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="px-3 py-2 bg-white text-black rounded-md text-sm">Update status</button>
      </form>
      <form action={moderateReviewAction}>
        <input type="hidden" name="id" value={review.id} />
        <input type="hidden" name="archived" value="true" />
        <button className="text-xs text-[#8b93a5]">Archive review</button>
      </form>

      {(images ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Photos</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(images ?? []).map((img) => (
              <div key={img.id} className="border border-white/10 rounded-md p-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reviewImageUrl(img.storage_path)} alt="" className="w-full h-40 object-cover rounded" />
                <p className="text-xs text-[#8b93a5] capitalize">{img.status}</p>
                <div className="flex gap-2">
                  <form action={moderateReviewImageAction}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button className="text-xs border border-white/10 rounded px-2 py-1">Approve</button>
                  </form>
                  <form action={moderateReviewImageAction}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button className="text-xs border border-white/10 rounded px-2 py-1">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(reports ?? []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Reports</h2>
          {(reports ?? []).map((report) => (
            <form key={report.id} action={resolveReportAction} className="text-sm border border-white/10 rounded-md p-3 flex justify-between">
              <input type="hidden" name="id" value={report.id} />
              <span>
                {report.reason} {report.details ? `· ${report.details}` : ""} {report.resolved ? "(resolved)" : ""}
              </span>
              {!report.resolved && <button className="text-xs">Resolve</button>}
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
