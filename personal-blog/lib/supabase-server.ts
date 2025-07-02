import { createClient } from "@supabase/supabase-js";

// For server components and API routes
export function createServerClient() {
  // Create a standard supabase client for server components
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
