import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      errorDescription || "Authentication failed"
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      const redirectUrl = new URL("/login", requestUrl.origin);
      redirectUrl.searchParams.set("error", "Failed to authenticate");
      return NextResponse.redirect(redirectUrl);
    }

    // Check if this is a password recovery flow
    const hashParams = new URLSearchParams(requestUrl.hash.slice(1));
    const type = hashParams.get("type") || requestUrl.searchParams.get("type");

    if (type === "recovery") {
      // Redirect to password update page for recovery flow
      return NextResponse.redirect(new URL("/update-password", requestUrl.origin));
    }

    // Successful authentication - redirect to the intended destination
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
