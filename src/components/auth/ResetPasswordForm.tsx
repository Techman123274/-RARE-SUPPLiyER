"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, AuthShell, authInputClass } from "@/components/auth/AuthShell";
import { MIN_PASSWORD_LENGTH, PasswordHints } from "@/components/auth/PasswordHints";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapAuthError } from "@/lib/auth-errors";
import { useAuth } from "@/context/AuthContext";

export function ResetPasswordForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setClaiming(false);
      return;
    }

    const claim = async () => {
      const supabase = createBrowserSupabaseClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        setClaiming(false);
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
      setClaiming(false);
    };

    void claim();
  }, [configured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || loading) return;
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("PLEASE CHOOSE A STRONGER PASSWORD.");
      return;
    }

    if (password !== confirm) {
      setError("PASSWORDS DO NOT MATCH.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }
      router.replace("/account");
      router.refresh();
    } catch {
      setError(mapAuthError(null));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || claiming) {
    return (
      <AuthShell kicker="SECURITY" title="RESET PASSWORD">
        <AuthMessage>Checking your reset link...</AuthMessage>
      </AuthShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthShell kicker="SECURITY" title="RESET PASSWORD">
        <AuthMessage tone="error">THIS PASSWORD RESET LINK HAS EXPIRED.</AuthMessage>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/forgot-password" className="text-foreground link-line">
            REQUEST A NEW LINK
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell kicker="SECURITY" title="RESET PASSWORD">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <AuthMessage tone="error">{error}</AuthMessage>
          </motion.div>
        )}

        <AuthField label="NEW PASSWORD">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="CONFIRM PASSWORD">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={authInputClass}
          />
        </AuthField>

        <PasswordHints password={password} confirm={confirm} />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "UPDATING..." : "SAVE NEW PASSWORD"}
        </Button>
      </form>
    </AuthShell>
  );
}
