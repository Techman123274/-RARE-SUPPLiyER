"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, AuthShell, authInputClass } from "@/components/auth/AuthShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapAuthError } from "@/lib/auth-errors";
import { authCallbackUrl } from "@/lib/auth-redirect";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || loading) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authCallbackUrl(window.location.origin, "/reset-password"),
      });

      if (resetError) {
        setError(mapAuthError(resetError));
        return;
      }

      setSent(true);
    } catch {
      setError(mapAuthError(null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell kicker="ACCOUNT RECOVERY" title="FORGOT PASSWORD">
      {sent ? (
        <AuthMessage>
          IF AN ACCOUNT EXISTS, WE’LL SEND YOU A PASSWORD RESET EMAIL.
        </AuthMessage>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthMessage>
            Enter the email for your account. If it exists, we’ll send a reset link.
          </AuthMessage>

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

          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!configured}>
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/login" className="text-foreground link-line">
          BACK TO SIGN IN
        </Link>
      </p>
    </AuthShell>
  );
}
