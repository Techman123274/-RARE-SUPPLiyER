import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "Add product — Admin" };

export default async function NewProductPage() {
  await requireStaff("products.write");
  const supabase = await createServerSupabaseClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium">Add product</h1>
      <ProductEditor product={null} categories={categories ?? []} sizes={[]} images={[]} />
    </div>
  );
}
