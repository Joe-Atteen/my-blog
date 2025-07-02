import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// For client components
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
