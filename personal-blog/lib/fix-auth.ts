"use client";

import { createBrowserClient } from "@/app/supabase-browser";

/**
 * Complete utility to clean up and fix authentication issues
 * This is a more aggressive approach to fixing auth problems
 */
export async function fixAuthIssues() {
  console.log("Running complete auth fix routine...");

  try {
    // 1. Clear specific auth-related items from localStorage
    const authKeys = [
      "sb-refresh-token",
      "sb-access-token",
      "supabase.auth.token",
      "supabase.auth.refreshToken",
    ];

    authKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.log(`Failed to remove ${key} from localStorage:`, e);
      }
    });

    // 2. Clear only auth-related cookies
    const authCookies = ["sb-refresh-token", "sb-access-token"];
    authCookies.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    console.log("Auth storage and cookies cleared");

    // 3. Sign out from Supabase to clean up any server-side session state
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    console.log("Signed out from Supabase successfully");

    // 4. Manually clear any cookie that might still be around after signOut
    authCookies.forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // 5. Display a message and redirect
    alert(
      "Authentication data has been cleared. You will be redirected to the login page."
    );

    // 6. Redirect to login page
    window.location.href = "/login?fixed=true";
  } catch (e) {
    console.error("Error during auth fix:", e);
    alert(
      "There was a problem clearing authentication data. You will be redirected to the login page."
    );
    window.location.href = "/login?error=true";
  }
}

/**
 * Add to page with a button for user to click when auth errors occur
 */
// Component code moved to fix-auth.tsx since TSX is needed for JSX components
