"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, AuthShell, authInputClass } from "@/components/auth/AuthShell";
import { MIN_PASSWORD_LENGTH, PasswordHints } from "@/components/auth/PasswordHints";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapAuthError } from "@/lib/auth-errors";
import { authCallbackUrl, sanitizeNextPath } from "@/lib/auth-redirect";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const configured = isSupabaseConfigured();

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authCallbackUrl(window.location.origin, next),
        },
      });

      if (signUpError) {
        setError(mapAuthError(signUpError));
        return;
      }

      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }

      setCheckEmail(true);
    } catch {
      setError(mapAuthError(null));
    } finally {
      setLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthShell kicker="ALMOST THERE" title="CHECK YOUR EMAIL">
        <AuthMessage>
          We sent a verification link to {email}. Open that email to confirm your account
          before signing in.
        </AuthMessage>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground link-line">
            BACK TO SIGN IN
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell kicker="JOIN THE STORE" title="CREATE ACCOUNT">
      {!configured && (
        <AuthMessage tone="error">
          Authentication isn’t configured yet. Add your Supabase URL and public key to continue.
        </AuthMessage>
      )}

      {configured && (
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <p className="text-[11px] text-muted">
            Password must meet the required security criteria.
          </p>

          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!configured}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href={`/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground link-line">
          SIGN IN
        </Link>
      </p>
    </AuthShell>
  );
}
