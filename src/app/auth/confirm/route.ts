import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { mapAuthCallbackNotice } from "@/lib/auth-errors";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNextPath(searchParams.get("next"));

  if (!isSupabaseConfigured() || !tokenHash || !type) {
    const login = new URL("/login", origin);
    login.searchParams.set("notice", "invalid");
    return NextResponse.redirect(login);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (!error) {
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/reset-password", origin));
    }
    if (type === "signup" || type === "email") {
      return NextResponse.redirect(new URL("/auth/verified", origin));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  const login = new URL("/login", origin);
  login.searchParams.set("notice", mapAuthCallbackNotice(error.code ?? null, error.message));
  return NextResponse.redirect(login);
}
