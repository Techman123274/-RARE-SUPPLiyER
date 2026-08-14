"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, authInputClass } from "@/components/auth/AuthShell";
import { MIN_PASSWORD_LENGTH, PasswordHints } from "@/components/auth/PasswordHints";
import { useAuth } from "@/context/AuthContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth-errors";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("PLEASE CHOOSE A STRONGER PASSWORD.");
      return;
    }
    if (password !== confirm) {
      setError("PASSWORDS DO NOT MATCH.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }
      setPassword("");
      setConfirm("");
      setMessage("Password updated.");
    } catch {
      setError(mapAuthError(null));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-lg">
      <section className="glass p-6 sm:p-8 space-y-4">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">SETTINGS</p>
        <p className="text-sm text-muted">
          Account preferences will expand here. Email changes will require verification.
        </p>
      </section>

      <section className="glass p-6 sm:p-8 space-y-5">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">SECURITY</p>
        <h2 className="text-2xl font-display tracking-wide">Change password</h2>
        <form onSubmit={changePassword} className="space-y-4">
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
          {error && <AuthMessage tone="error">{error}</AuthMessage>}
          {message && <AuthMessage tone="success">{message}</AuthMessage>}
          <Button type="submit" loading={saving}>
            {saving ? "UPDATING..." : "UPDATE PASSWORD"}
          </Button>
        </form>
      </section>

      <section className="glass p-6 sm:p-8 space-y-4">
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted">SESSION</p>
        <Button variant="secondary" onClick={handleSignOut} loading={signingOut}>
          {signingOut ? "SIGNING OUT..." : "LOG OUT"}
        </Button>
      </section>
    </div>
  );
}
