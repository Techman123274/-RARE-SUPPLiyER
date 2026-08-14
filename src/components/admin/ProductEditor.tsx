"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProduct, saveProduct } from "@/app/admin/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { publicStorageUrl, slugify } from "@/lib/store/media";
import { PRODUCT_CONDITIONS } from "@/lib/types";
import type { CategoryRow, ProductRow, ProductStatus } from "@/lib/supabase/database.types";

interface SizeRow {
  size: string;
  quantity: number;
}

interface ImageRow {
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
}

export function ProductEditor({
  product,
  categories,
  sizes,
  images,
}: {
  product: ProductRow | null;
  categories: CategoryRow[];
  sizes: SizeRow[];
  images: ImageRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(sizes.length ? sizes : [{ size: "", quantity: 0 }]);
  const [imageRows, setImageRows] = useState<ImageRow[]>(images);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const profit = useMemo(() => {
    return null;
  }, []);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const supabase = createBrowserSupabaseClient();
    const uploaded: ImageRow[] = [];
    for (const file of Array.from(files)) {
      const path = `${product?.id ?? "draft"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (uploadError) {
        setError("Could not upload image. Check that you are signed in as staff.");
        continue;
      }
      uploaded.push({
        storage_path: path,
        sort_order: imageRows.length + uploaded.length,
        is_primary: imageRows.length + uploaded.length === 0,
      });
    }
    setImageRows((prev) => {
      const next = [...prev, ...uploaded];
      return next.map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 ? true : img.is_primary && i === 0 }));
    });
  };

  const submit = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    const form = document.getElementById("product-form") as HTMLFormElement;
    const data = new FormData(form);
    data.set("sizes_json", JSON.stringify(sizeRows.filter((s) => s.size.trim())));
    data.set("images_json", JSON.stringify(imageRows));
    data.set("publish", publish ? "1" : "0");
    const result = await saveProduct(data);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form id="product-form" className="grid lg:grid-cols-[320px_1fr] gap-6">
        <input type="hidden" name="id" defaultValue={product?.id ?? ""} />
        <section className="rounded-lg border border-white/10 bg-[#161821] p-4 space-y-3">
          <h2 className="text-sm font-medium">Images</h2>
          <div className="grid grid-cols-2 gap-2">
            {imageRows.map((img, index) => (
              <div key={`${img.storage_path}-${index}`} className="relative border border-white/10 rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicStorageUrl(img.storage_path)} alt="" className="h-28 w-full object-cover" />
                <div className="flex gap-1 p-1">
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 bg-black/50 rounded"
                    onClick={() =>
                      setImageRows((rows) => rows.map((row, i) => ({ ...row, is_primary: i === index })))
                    }
                  >
                    {img.is_primary ? "Primary" : "Set primary"}
                  </button>
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 bg-black/50 rounded"
                    onClick={() => setImageRows((rows) => rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={(e) => void onUpload(e.target.files)} />
        </section>

        <div className="space-y-5">
          <section className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-2 gap-3">
            <Field label="Name" name="name" defaultValue={product?.name} required />
            <Field label="Brand" name="brand" defaultValue={product?.brand} required />
            <Field label="SKU" name="sku" defaultValue={product?.sku} required />
            <Field label="Slug" name="slug" defaultValue={product?.slug ?? slugify(product?.name ?? "")} />
            <label className="text-xs text-[#8b93a5] sm:col-span-2">
              Category
              <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputClass}>
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#8b93a5] sm:col-span-2">
              Description
              <textarea name="description" defaultValue={product?.description ?? ""} rows={4} className={inputClass} />
            </label>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-3 gap-3">
            <h2 className="sm:col-span-3 text-sm font-medium">Pricing</h2>
            <Field label="Cost (admin only)" name="cost" type="number" defaultValue={product?.cost ?? ""} />
            <Field label="List price" name="list_price" type="number" defaultValue={product?.list_price ?? ""} required />
            <Field label="Sale price" name="sale_price" type="number" defaultValue={product?.sale_price ?? ""} />
            {profit}
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161821] p-4 space-y-3">
            <h2 className="text-sm font-medium">Inventory by size</h2>
            {sizeRows.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_120px_80px] gap-2">
                <input
                  value={row.size}
                  onChange={(e) =>
                    setSizeRows((rows) => rows.map((r, i) => (i === index ? { ...r, size: e.target.value } : r)))
                  }
                  placeholder="Size"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) =>
                    setSizeRows((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, quantity: Number(e.target.value) } : r))
                    )
                  }
                  className={inputClass}
                />
                <button type="button" className="text-xs" onClick={() => setSizeRows((rows) => rows.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="text-xs text-[#4da3ff]" onClick={() => setSizeRows((rows) => [...rows, { size: "", quantity: 0 }])}>
              Add size
            </button>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-[#8b93a5]">
              Condition
              <select name="condition" defaultValue={product?.condition ?? "Good"} className={inputClass}>
                {PRODUCT_CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <Field label="Condition details" name="condition_details" defaultValue={product?.condition_details ?? ""} />
            <label className="text-xs text-[#8b93a5]">
              Status
              <select name="status" defaultValue={product?.status ?? "draft"} className={inputClass}>
                {(["draft", "active", "sold_out", "archived"] as ProductStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#8b93a5] flex items-center gap-2 mt-6">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured
            </label>
            <Field label="SEO title" name="seo_title" defaultValue={product?.seo_title ?? ""} />
            <Field label="SEO description" name="seo_description" defaultValue={product?.seo_description ?? ""} />
            <label className="text-xs text-[#8b93a5] sm:col-span-2">
              Internal notes (never shown to customers)
              <textarea name="internal_notes" defaultValue={product?.internal_notes ?? ""} rows={3} className={inputClass} />
            </label>
          </section>
        </div>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button disabled={saving} onClick={() => void submit(false)} className="px-4 py-2 rounded-md border border-white/10 text-sm">
          Save product
        </button>
        <button disabled={saving} onClick={() => void submit(true)} className="px-4 py-2 rounded-md bg-white text-black text-sm">
          Save & publish
        </button>
        {product && (
          <button type="button" className="px-4 py-2 rounded-md text-sm text-red-300" onClick={() => setConfirmArchive(true)}>
            Archive
          </button>
        )}
      </div>

      {confirmArchive && product && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161821] border border-white/10 rounded-lg p-6 max-w-sm space-y-4">
            <p className="text-sm">Archive this product? It will leave the storefront but stay in the database.</p>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm border border-white/10 rounded-md" onClick={() => setConfirmArchive(false)}>Cancel</button>
              <button
                className="px-3 py-2 text-sm bg-red-500 text-white rounded-md"
                onClick={async () => {
                  const result = await archiveProduct(product.id);
                  if (!result.ok) setError(result.error);
                  else router.push("/admin/products");
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = "mt-1 w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm text-white";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs text-[#8b93a5]">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} step="0.01" className={inputClass} />
    </label>
  );
}
