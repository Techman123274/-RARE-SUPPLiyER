import Link from "next/link";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadProductExtras, loadStaffProducts } from "@/lib/store/admin-data";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  await requireStaff("products.write");
  const products = await loadStaffProducts();
  const extras = await loadProductExtras(products.map((p) => p.id));
  const supabase = await createServerSupabaseClient();
  const { data: categories } = await supabase.from("categories").select("id, name");
  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const stock = new Map<string, number>();
  for (const row of extras.sizes) {
    stock.set(row.product_id, (stock.get(row.product_id) ?? 0) + row.quantity);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Products</h1>
          <p className="text-sm text-[#8b93a5]">Archive instead of deleting. Cost is never sent to the storefront.</p>
        </div>
        <Link href="/admin/products/new" className="px-3 py-2 bg-white text-black text-sm rounded-md">Add product</Link>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No products yet. Add your first piece of inventory.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Status</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Price</th>
                <th className="p-3">Cost</th>
                <th className="p-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const qty = stock.get(p.id) ?? 0;
                const price = p.sale_price && Number(p.sale_price) < Number(p.list_price) ? Number(p.sale_price) : Number(p.list_price);
                const cost = p.cost != null ? Number(p.cost) : null;
                return (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="p-3">
                      <Link href={`/admin/products/${p.id}`} className="hover:text-white">
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-[#8b93a5]">{p.brand} · {categoryName.get(p.category_id ?? "") ?? "—"}</div>
                    </td>
                    <td className="p-3 font-mono text-xs">{p.sku}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3 font-mono">{qty}</td>
                    <td className="p-3 font-mono">{formatPrice(price)}</td>
                    <td className="p-3 font-mono">{cost != null ? formatPrice(cost) : "—"}</td>
                    <td className="p-3 font-mono">{cost != null ? formatPrice(price - cost) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
