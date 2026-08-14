import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveCategoryAction } from "../actions";

export const metadata = { title: "Categories — Admin" };

export default async function CategoriesPage() {
  await requireStaff("categories.write");
  const supabase = await createServerSupabaseClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Categories</h1>
      <form action={saveCategoryAction} className="rounded-lg border border-white/10 bg-[#161821] p-4 grid sm:grid-cols-4 gap-3">
        <input name="name" placeholder="Name" required className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="slug" placeholder="slug" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="sort_order" type="number" defaultValue={0} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <button className="bg-white text-black rounded-md text-sm">Add category</button>
      </form>
      <div className="space-y-2">
        {(categories ?? []).map((c) => (
          <form key={c.id} action={saveCategoryAction} className="grid sm:grid-cols-[1fr_1fr_80px_auto] gap-2 items-center">
            <input type="hidden" name="id" value={c.id} />
            <input name="name" defaultValue={c.name} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
            <input name="slug" defaultValue={c.slug} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
            <input name="sort_order" type="number" defaultValue={c.sort_order} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button className="text-xs border border-white/10 rounded-md px-3 py-2">Save</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
