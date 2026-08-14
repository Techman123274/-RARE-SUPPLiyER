import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveBannerAction, saveHomepageSectionAction } from "../actions";

export const metadata = { title: "Content — Admin" };

export default async function ContentPage() {
  await requireStaff("content.write");
  const supabase = await createServerSupabaseClient();
  const [{ data: banners }, { data: sections }] = await Promise.all([
    supabase.from("banners").select("*").order("sort_order"),
    supabase.from("homepage_sections").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-medium">Homepage & banners</h1>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Homepage sections</h2>
        {(sections ?? []).map((section) => (
          <form key={section.id} action={saveHomepageSectionAction} className="grid sm:grid-cols-[1fr_80px_100px_auto] gap-2">
            <input type="hidden" name="id" value={section.id} />
            <input name="title" defaultValue={section.title ?? section.key} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
            <input name="sort_order" type="number" defaultValue={section.sort_order} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
            <select name="enabled" defaultValue={section.enabled ? "true" : "false"} className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm">
              <option value="true">On</option>
              <option value="false">Off</option>
            </select>
            <button className="text-xs border border-white/10 rounded-md px-3">Save</button>
          </form>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">New banner</h2>
        <form action={saveBannerAction} className="grid sm:grid-cols-2 gap-3 rounded-lg border border-white/10 p-4">
          <input name="title" placeholder="Title" required className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input name="description" placeholder="Description" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input name="cta_label" placeholder="CTA label" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input name="cta_href" placeholder="/shop" className="bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input name="image_path" placeholder="Image URL or storage path" className="sm:col-span-2 bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
          <button className="bg-white text-black rounded-md text-sm py-2">Create banner</button>
        </form>
        {(banners ?? []).length === 0 ? (
          <p className="text-sm text-[#8b93a5]">No banners yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(banners ?? []).map((b) => (
              <li key={b.id} className="border border-white/10 rounded-md p-3">
                {b.title} · {b.active ? "active" : "inactive"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
