"use client";

import { createBrowserClient as createClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if running in browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

// For client components - persistent session configuration
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    // Configure cookies for proper session persistence
    cookies: {
      get(name) {
        // If not in browser, return undefined (this will happen during SSR)
        if (!isBrowser) {
          return undefined;
        }

        try {
          // First check cookies
          const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));

          // If found in cookies, return that
          if (cookie) {
            return decodeURIComponent(cookie.split("=")[1]);
          }

          // If not found in cookies but this is an auth token, check localStorage as fallback
          if (name === "sb-refresh-token" || name === "sb-access-token") {
            const localValue = localStorage.getItem(name);
            if (localValue) {
              console.log(`Retrieved ${name} from localStorage fallback`);
              return localValue;
            }
          }

          // Nothing found
          return undefined;
        } catch (e) {
          console.error(`Error getting cookie ${name}:`, e);
          return undefined;
        }
      },
      set(name, value, options) {
        // If not in browser, do nothing (this will happen during SSR)
        if (!isBrowser) {
          return;
        }

        try {
          // Set the cookie
          let cookie = `${name}=${encodeURIComponent(value)}`;

          if (options?.path) {
            cookie += `; path=${options.path}`;
          }

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }

          if (options?.domain) {
            cookie += `; domain=${options.domain}`;
          }

          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`;
          }

          if (options?.secure) {
            cookie += `; secure`;
          }

          if (options?.expires) {
            cookie += `; expires=${options.expires.toUTCString()}`;
          }

          document.cookie = cookie;

          // For auth tokens, also save in localStorage as backup
          if (
            (name === "sb-refresh-token" || name === "sb-access-token") &&
            value
          ) {
            localStorage.setItem(name, value);
          }
        } catch (e) {
          console.error(`Error setting cookie ${name}:`, e);
        }
      },
      remove(name, options) {
        // If not in browser, do nothing (this will happen during SSR)
        if (!isBrowser) {
          return;
        }

        try {
          // Remove the cookie - properly set expires in the past
          const expires = new Date(0).toUTCString();
          document.cookie = `${name}=; expires=${expires}; max-age=0; path=${
            options?.path || "/"
          }`;

          // Also remove from localStorage if it's an auth token
          if (name === "sb-refresh-token" || name === "sb-access-token") {
            localStorage.removeItem(name);
          }
        } catch (e) {
          console.error(`Error removing cookie ${name}:`, e);
        }
      },
    },
    // Specify auth options
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
};
