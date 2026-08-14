import { requireStaff } from "@/lib/store/require-staff";
import { loadProductExtras, loadStaffProducts } from "@/lib/store/admin-data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Inventory — Admin" };

export default async function InventoryPage() {
  await requireStaff("inventory.write");
  const products = await loadStaffProducts();
  const extras = await loadProductExtras(products.map((p) => p.id));
  const byProduct = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Inventory</h1>
        <p className="text-sm text-[#8b93a5]">Stock is tracked by size. Zero across all sizes marks a product sold out.</p>
      </div>
      {extras.sizes.length === 0 ? (
        <p className="text-sm text-[#8b93a5]">No inventory rows yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-[#8b93a5] bg-[#161821]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Size</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {extras.sizes.map((row) => {
                const product = byProduct.get(row.product_id);
                if (!product) return null;
                const warning = row.quantity <= 1;
                return (
                  <tr key={`${row.product_id}-${row.size}`} className="border-t border-white/5">
                    <td className="p-3">
                      <Link href={`/admin/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td className="p-3 font-mono text-xs">{product.sku}</td>
                    <td className="p-3">{row.size}</td>
                    <td className={`p-3 font-mono ${warning ? "text-amber-300" : ""}`}>{row.quantity}</td>
                    <td className="p-3 font-mono">{formatPrice(Number(product.list_price))}</td>
                    <td className="p-3">{product.status}</td>
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
