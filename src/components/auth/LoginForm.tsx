"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, AuthShell, authInputClass } from "@/components/auth/AuthShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapAuthError, noticeFromCode } from "@/lib/auth-errors";
import { sanitizeNextPath } from "@/lib/auth-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"));
  const noticeCode = searchParams.get("notice");
  const notice = noticeFromCode(noticeCode);
  const noticeTone = noticeCode === "verified" ? "success" : "error";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || loading) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError));
        return;
      }

      try {
        await supabase.rpc("ensure_owner_admin");
      } catch {
        // Owner restore is best-effort until promote-admin.sql is applied.
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError(mapAuthError(null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell kicker="WELCOME BACK" title="SIGN IN">
      {!configured && (
        <AuthMessage tone="error">
          Authentication isn’t configured yet. Add your Supabase URL and public key to continue.
        </AuthMessage>
      )}

      {configured && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {notice && !error && (
            <AuthMessage tone={noticeTone}>{notice}</AuthMessage>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <AuthMessage tone="error">{error}</AuthMessage>
            </motion.div>
          )}

          <AuthField label="EMAIL">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
          </AuthField>

          <AuthField label="PASSWORD">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </AuthField>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[10px] tracking-[0.18em] font-mono text-muted hover:text-foreground link-line"
            >
              FORGOT PASSWORD?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!configured}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        New here?{" "}
        <Link href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground link-line">
          CREATE ACCOUNT
        </Link>
      </p>
    </AuthShell>
  );
}
