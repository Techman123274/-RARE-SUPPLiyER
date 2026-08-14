import { requireStaff } from "@/lib/store/require-staff";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveSettingsAction } from "../actions";

export const metadata = { title: "Settings — Admin" };

export default async function SettingsPage() {
  await requireStaff("settings.write");
  const supabase = await createServerSupabaseClient();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", "default").maybeSingle();

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-medium">Store settings</h1>
      <form action={saveSettingsAction} className="space-y-3">
        <input name="store_name" defaultValue={settings?.store_name} className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="contact_email" defaultValue={settings?.contact_email ?? ""} placeholder="Contact email" className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="instagram_url" defaultValue={settings?.instagram_url ?? ""} placeholder="Instagram URL" className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="tiktok_url" defaultValue={settings?.tiktok_url ?? ""} placeholder="TikTok URL" className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="shipping_flat" type="number" step="0.01" defaultValue={settings?.shipping_flat} className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="free_shipping_threshold" type="number" step="0.01" defaultValue={settings?.free_shipping_threshold ?? ""} placeholder="Free shipping threshold" className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <input name="tax_rate" type="number" step="0.0001" defaultValue={settings?.tax_rate} className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="maintenance_mode" defaultChecked={settings?.maintenance_mode} /> Maintenance mode
        </label>
        <button className="px-4 py-2 bg-white text-black rounded-md text-sm">Save settings</button>
      </form>
    </div>
  );
}
