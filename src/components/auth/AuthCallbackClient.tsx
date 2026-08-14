"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthMessage, AuthShell } from "@/components/auth/AuthShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { mapAuthCallbackNotice } from "@/lib/auth-errors";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const next = sanitizeNextPath(searchParams.get("next"));
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (error || errorCode) {
      const notice = mapAuthCallbackNotice(errorCode ?? error, errorDescription);
      router.replace(`/login?notice=${encodeURIComponent(notice)}`);
      return;
    }

    if (!isSupabaseConfigured()) {
      router.replace("/login?notice=generic");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const finish = async () => {
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          try {
            await supabase.rpc("ensure_owner_admin");
          } catch {
            // Owner restore is best-effort until promote-admin.sql is applied.
          }
          router.replace(next);
          router.refresh();
          return;
        }
        router.replace(
          `/login?notice=${encodeURIComponent(
            mapAuthCallbackNotice(exchangeError.code ?? null, exchangeError.message)
          )}`
        );
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const type = hash.get("type");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError) {
          try {
            await supabase.rpc("ensure_owner_admin");
          } catch {
            // Owner restore is best-effort until promote-admin.sql is applied.
          }
          router.replace(type === "recovery" ? "/reset-password" : next);
          router.refresh();
          return;
        }
      }

      setStatus("This link is invalid or has expired.");
      router.replace("/login?notice=invalid");
    };

    void finish();
  }, [router, searchParams]);

  return (
    <AuthShell kicker="ACCOUNT" title="ONE MOMENT">
      <AuthMessage>{status}</AuthMessage>
    </AuthShell>
  );
}
