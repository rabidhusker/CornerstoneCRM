import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Admin client bypasses Row Level Security (RLS)
// Use only for background jobs, webhooks, and server-side operations
// that require elevated privileges
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
