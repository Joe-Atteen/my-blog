"use client";

import { createBrowserClient } from "@/app/supabase-browser";

/**
 * Utility function to extend the current Supabase session
 * @returns Promise with the result of the session refresh attempt
 */
export async function extendSession() {
  try {
    const supabase = createBrowserClient();

    // Check if we have an existing session first
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session to extend");
    }

    // Get the current user to verify authentication
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      throw new Error("No authenticated user found");
    }

    // Refresh the session to extend the token expiration
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error("Failed to extend session");
    }

    // Set cookies explicitly to ensure they are properly stored
    const refreshToken = localStorage.getItem("sb-refresh-token");
    const accessToken = localStorage.getItem("sb-access-token");

    if (refreshToken && accessToken) {
      // Set with long expiration for refresh token (7 days) and shorter for access token (1 hour)
      document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    }

    return {
      success: true,
      session: data.session,
      message: "Session extended successfully",
    };
  } catch (error) {
    console.error("Error extending session:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
