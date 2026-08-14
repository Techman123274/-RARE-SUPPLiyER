import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadStaffProducts, loadProductExtras } from "@/lib/store/admin-data";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "Edit product — Admin" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("products.write");
  const { id } = await params;
  const products = await loadStaffProducts();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  const extras = await loadProductExtras([id]);
  const supabase = await createServerSupabaseClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium">Edit product</h1>
      <ProductEditor
        product={product}
        categories={categories ?? []}
        sizes={extras.sizes.map((s) => ({ size: s.size, quantity: s.quantity }))}
        images={extras.images.map((img) => ({
          storage_path: img.storage_path,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
        }))}
      />
    </div>
  );
}
