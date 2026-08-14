import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";
import { sanitizeNextPath } from "@/lib/auth-redirect";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

function redirectWithSession(url: URL, request: NextRequest, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  copyCookies(sessionResponse, redirect);
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    if (pathname.startsWith("/account") || (pathname.startsWith("/admin") && pathname !== "/admin/login")) {
      const login = request.nextUrl.clone();
      login.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password")) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    const destination = request.nextUrl.clone();
    destination.pathname = next;
    destination.search = "";
    return redirectWithSession(destination, request, supabaseResponse);
  }

  if (pathname.startsWith("/account") && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    return redirectWithSession(login, request, supabaseResponse);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    login.searchParams.set("next", pathname);
    return redirectWithSession(login, request, supabaseResponse);
  }

  return supabaseResponse;
}
