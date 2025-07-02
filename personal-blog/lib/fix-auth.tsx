"use client";

import { createBrowserClient } from "@/app/supabase-browser";

/**
 * Complete utility to clean up and fix authentication issues
 * This is a more aggressive approach to fixing auth problems
 */
export function fixAuthIssues() {
  console.log("Running complete auth fix routine...");

  // 1. Clear ALL storage and cookies
  localStorage.clear(); // Clear all localStorage
  sessionStorage.clear(); // Clear all sessionStorage

  // Clear cookies
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.trim().split("=")[0];
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  console.log("All storage and cookies cleared");

  // 2. Force a complete new session creation
  try {
    const supabase = createBrowserClient();
    supabase.auth.signOut().then(() => {
      console.log("Signed out successfully");
      // Redirect to login after a brief delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    });
  } catch (e) {
    console.error("Error during auth fix:", e);
    // Redirect anyway
    window.location.href = "/login";
  }
}

/**
 * Add to page with a button for user to click when auth errors occur
 */
export function AuthFixButton() {
  return (
    <button
      onClick={() => fixAuthIssues()}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Fix Authentication Issues
    </button>
  );
}
