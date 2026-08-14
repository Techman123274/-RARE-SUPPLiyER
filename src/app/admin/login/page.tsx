import { loginAdmin } from "../actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Admin Login — RARE SUPPLiyER" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="admin-app min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-white/10 rounded-xl bg-[#161821] p-8">
        <p className="text-[10px] tracking-[0.28em] text-[#4da3ff] font-mono mb-2">RARE SUPPLiyER</p>
        <h1 className="text-xl font-medium mb-1">Admin sign in</h1>
        <p className="text-sm text-[#8b93a5] mb-6">Staff accounts only. Customers cannot access this area.</p>

        {error === "invalid" && <p className="text-sm text-red-400 mb-4">Invalid email or password.</p>}
        {error === "forbidden" && (
          <p className="text-sm text-red-400 mb-4">This account is not an administrator.</p>
        )}
        {error === "config" && (
          <p className="text-sm text-red-400 mb-4">Supabase is not configured on this environment.</p>
        )}
        {!configured && (
          <p className="text-sm text-amber-300 mb-4">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then run supabase/schema.sql.
          </p>
        )}

        <form action={loginAdmin} className="space-y-4">
          <div>
            <label className="text-xs text-[#8b93a5] block mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#8b93a5] block mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-[#0c0d12] border border-white/10 rounded-md px-3 py-2.5 text-sm"
            />
          </div>
          <button className="w-full py-2.5 bg-white text-black text-sm font-medium rounded-md">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
