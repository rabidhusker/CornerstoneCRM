import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Filter out corrupted cookies that contain full JSON auth responses
 * This prevents the "Cannot create property 'user' on string" error
 */
function filterCorruptedCookies(cookies: { name: string; value: string }[]): { name: string; value: string }[] {
  return cookies.filter(cookie => {
    const value = cookie.value?.trim() || '';
    
    // Filter out cookies that look like full JSON auth responses
    if ((value.startsWith('{') || value.startsWith('[')) && value.length > 30) {
      return false;
    }
    
    // Filter out cookies with auth response patterns
    if (value.includes('"access_token"') || value.includes('"refresh_token"')) {
      return false;
    }
    
    return true;
  });
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Filter out corrupted cookies that contain full JSON auth responses
          return filterCorruptedCookies(cookieStore.getAll());
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
}
