"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { createBrowserClient } from "@/app/supabase-browser";

/**
 * Hook to detect authentication errors and handle them gracefully
 * This helps prevent poor user experience when auth tokens expire
 */
export function useAuthErrorHandler() {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Unused session parameter removed
      if (event === "TOKEN_REFRESHED") {
        console.log("Token has been refreshed");
      }

      if (event === "SIGNED_OUT") {
        // If signed out, redirect to login
        console.log("User has been signed out");
        toast.info("Your session has expired. Please log in again.");
        router.push("/login");
      }
    });

    // Function to check auth and handle specific error cases
    const checkAuth = async () => {
      // Skip auth checks on login, logout, or public pages to avoid loops
      if (
        window.location.pathname === "/login" ||
        window.location.pathname === "/logout" ||
        window.location.pathname === "/debug-session" ||
        window.location.pathname === "/direct-admin" ||
        !window.location.pathname.startsWith("/admin")
      ) {
        return;
      }

      try {
        // Check if we have tokens in localStorage or cookies
        const hasLocalToken =
          localStorage.getItem("sb-refresh-token") ||
          localStorage.getItem("supabase.auth.token");

        const hasCookieToken =
          document.cookie.includes("sb-refresh-token") ||
          document.cookie.includes("sb-access-token");

        // If no tokens at all and we're on a protected route, redirect to login
        if (
          !hasLocalToken &&
          !hasCookieToken &&
          window.location.pathname.startsWith("/admin")
        ) {
          console.log("No auth tokens found, redirecting to login");
          // Don't clear auth data here - it's already missing
          router.push("/login");
          return;
        }

        // Only proceed with auth check if we have tokens
        if (hasLocalToken || hasCookieToken) {
          try {
            // First try to refresh the session
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession();

            if (refreshError) {
              console.log("Failed to refresh session:", refreshError.message);

              // Only clear data and redirect for specific token errors
              if (
                refreshError.message
                  ?.toLowerCase()
                  .includes("refresh token not found") ||
                refreshError.message
                  ?.toLowerCase()
                  .includes("invalid refresh token") ||
                refreshError.message?.toLowerCase().includes("token expired")
              ) {
                console.log("Token issue detected, redirecting to login");
                clearAuthData();
                toast.error("Your session has expired. Please log in again.");
                router.push("/login");
                return;
              }
            } else if (refreshData.session) {
              console.log("Session refreshed successfully");
              // No need to redirect, session is valid
              return;
            }

            // Fall back to regular session check
            const { data: sessionData } = await supabase.auth.getSession();

            if (!sessionData.session) {
              console.log("No active session found during check");
              // Don't immediately redirect - this might be a temporary issue
              return;
            }
          } catch (sessionError) {
            console.error("Session check error:", sessionError);
            // Don't immediately redirect for unexpected errors
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    };

    // Helper to clear all auth data
    const clearAuthData = () => {
      // Clear localStorage
      localStorage.removeItem("sb-refresh-token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("supabase.auth.token");

      // Clear cookies by setting to expired
      document.cookie =
        "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Also sign out from Supabase (this creates a clean slate)
      supabase.auth
        .signOut()
        .catch((e) => console.error("Error during sign out:", e));
    };

    // Run check immediately
    checkAuth();

    // Set up periodic checks
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [router, supabase]);

  return null;
}

/**
 * Component to wrap authenticated sections of the app
 * This will handle auth errors and redirect to login if needed
 */
export function AuthErrorHandler({ children }: { children: React.ReactNode }) {
  useAuthErrorHandler();
  return <>{children}</>;
}
