"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import { isStaffRole } from "@/lib/store/roles";
import { loadProfileRow, restoreOwnerAdmin } from "@/lib/store/ensure-owner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isLoading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [staffFlag, setStaffFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(configured);

  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      const supabase = createBrowserSupabaseClient();
      await restoreOwnerAdmin(supabase);

      const first = await loadProfileRow(supabase, currentUser.id);
      let nextProfile = first.profile;

      if (!first.unavailable && !nextProfile && currentUser.email) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: currentUser.id,
          email: currentUser.email,
          display_name: currentUser.email.split("@")[0],
        });
        if (!insertError) {
          await restoreOwnerAdmin(supabase);
          nextProfile = (await loadProfileRow(supabase, currentUser.id)).profile;
        }
      }

      if (nextProfile) setProfile(nextProfile);
      if (first.unavailable) return;

      const { data: staff } = await supabase.rpc("is_staff");
      setStaffFlag(Boolean(staff || (nextProfile?.is_active && isStaffRole(nextProfile.role))));
    } catch {
      // Keep the last known profile/staff state instead of dropping admin on a failed fetch.
    }
  }, []);

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (cancelled) return;
        setUser(data.user ?? null);
        const sessionRes = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(sessionRes.data.session);
        if (data.user) {
          await loadProfile(data.user);
          return;
        }
        setProfile(null);
        setStaffFlag(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setTimeout(() => {
        if (cancelled) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (!nextSession?.user) {
          setProfile(null);
          setStaffFlag(false);
          return;
        }
        if (event === "TOKEN_REFRESHED") return;
        void loadProfile(nextSession.user);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [loadProfile, user]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setStaffFlag(false);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAuthenticated: Boolean(user),
      isStaff: staffFlag || Boolean(profile?.is_active && isStaffRole(profile.role)),
      isLoading,
      configured,
      refreshProfile,
      signOut,
    }),
    [user, session, profile, staffFlag, isLoading, configured, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function accountGreeting(profile: Profile | null, user: User | null): string {
  const name = profile?.display_name?.trim();
  if (name) return `Hi, ${name.split(" ")[0]}`;
  const emailName = user?.email?.split("@")[0];
  if (emailName) return `Hi, ${emailName}`;
  return "ACCOUNT";
}
