"use server";

import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name) => {
          const cookie = (await cookies()).get(name);
          return cookie?.value;
        },
        set: async (name, value, options) => {
          try {
            (await cookies()).set({ name, value, ...options });
          } catch {
            // This will throw in middleware when the response is already sent
          }
        },
        remove: async (name, options) => {
          try {
            (await cookies()).set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // This will throw in middleware when the response is already sent
          }
        },
      },
    }
  );
}
