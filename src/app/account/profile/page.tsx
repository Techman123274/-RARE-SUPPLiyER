"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthField, AuthMessage, authInputClass } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth-errors";

export default function AccountProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const profileName = profile?.display_name ?? "";
  const [name, setName] = useState(profileName);
  const [syncedName, setSyncedName] = useState(profileName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (profileName !== syncedName) {
    setSyncedName(profileName);
    setName(profileName);
  }

  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: name.trim().slice(0, 80) || null })
        .eq("id", user.id);
      if (updateError) {
        setError(mapAuthError(updateError));
        return;
      }
      await refreshProfile();
      setMessage("Profile saved.");
    } catch {
      setError(mapAuthError(null));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass p-6 sm:p-8 space-y-6 max-w-lg">
      <div>
        <p className="text-[10px] tracking-[0.22em] font-mono text-muted mb-2">PROFILE</p>
        <h2 className="text-2xl font-display tracking-wide">Your details</h2>
      </div>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted text-xs mb-1">Email</dt>
          <dd>{user?.email}</dd>
        </div>
        <div>
          <dt className="text-muted text-xs mb-1">Account created</dt>
          <dd>{created}</dd>
        </div>
      </dl>

      <form onSubmit={save} className="space-y-4">
        <AuthField label="NAME">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
            autoComplete="name"
          />
        </AuthField>
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        {message && <AuthMessage tone="success">{message}</AuthMessage>}
        <Button type="submit" loading={saving}>
          {saving ? "SAVING..." : "SAVE PROFILE"}
        </Button>
      </form>
    </div>
  );
}
