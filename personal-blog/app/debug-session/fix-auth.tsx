"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fixAuthIssues } from "@/lib/fix-auth";
import { createBrowserClient } from "@/app/supabase-browser";

interface AuthDebugInfo {
  localStorage: {
    refreshToken: string;
    accessToken: string;
  };
  cookies: {
    refreshToken: string;
    accessToken: string;
  };
}

export default function FixAuthPage() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Collect debug information about auth state
  useEffect(() => {
    const getAuthInfo = () => {
      // Check localStorage
      const lsRefreshToken = localStorage.getItem("sb-refresh-token");
      const lsAccessToken = localStorage.getItem("sb-access-token");

      // Check cookies
      const hasCookieRefreshToken =
        document.cookie.includes("sb-refresh-token");
      const hasCookieAccessToken = document.cookie.includes("sb-access-token");

      return {
        localStorage: {
          refreshToken: lsRefreshToken ? "Present" : "Missing",
          accessToken: lsAccessToken ? "Present" : "Missing",
        },
        cookies: {
          refreshToken: hasCookieRefreshToken ? "Present" : "Missing",
          accessToken: hasCookieAccessToken ? "Present" : "Missing",
        },
      };
    };

    setDebugInfo(getAuthInfo());
  }, []);

  const handleFixAuth = async () => {
    setLoading(true);
    try {
      await fixAuthIssues();
      // Redirect to login after cleanup
      window.location.href = "/login";
    } catch (error) {
      console.error("Error fixing auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBypassAuth = () => {
    window.location.href = "/admin?bypass=true";
  };

  const syncCookiesFromLocalStorage = () => {
    setLoading(true);
    try {
      // Get tokens from localStorage
      const refreshToken = localStorage.getItem("sb-refresh-token");
      const accessToken = localStorage.getItem("sb-access-token");

      if (refreshToken && accessToken) {
        // Set as cookies with proper attributes
        document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;

        alert("Auth tokens synchronized from localStorage to cookies");
        window.location.reload();
      } else {
        alert("No tokens found in localStorage to sync");
      }
    } catch (e) {
      console.error("Error syncing tokens:", e);
      alert(
        "Failed to sync tokens: " + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  };

  const syncLocalStorageFromCookies = () => {
    setLoading(true);
    try {
      // Extract tokens from cookies
      const cookies = document.cookie.split("; ");
      let refreshToken = "";
      let accessToken = "";

      for (const cookie of cookies) {
        if (cookie.startsWith("sb-refresh-token=")) {
          refreshToken = cookie.split("=")[1];
        } else if (cookie.startsWith("sb-access-token=")) {
          accessToken = cookie.split("=")[1];
        }
      }

      if (refreshToken && accessToken) {
        // Store in localStorage
        localStorage.setItem("sb-refresh-token", refreshToken);
        localStorage.setItem("sb-access-token", accessToken);

        alert("Auth tokens synchronized from cookies to localStorage");
        window.location.reload();
      } else {
        alert("No tokens found in cookies to sync");
      }
    } catch (e) {
      console.error("Error syncing tokens:", e);
      alert(
        "Failed to sync tokens: " + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  };

  const forceAuthRefresh = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();

      // Get the current session
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        alert("No active session found to refresh");
        return;
      }

      // Force a session refresh
      const { data: refreshData, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (refreshData.session) {
        alert("Session successfully refreshed. Redirecting to admin page...");
        // Give the browser a moment to update cookies/storage
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
      } else {
        alert("Failed to refresh session");
      }
    } catch (e) {
      console.error("Error refreshing auth:", e);
      alert(
        "Failed to refresh auth: " +
          (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Auth Debug & Fix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Current Auth State:</h3>
              <pre className="mt-2 bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleFixAuth}
                disabled={loading}
                variant="destructive"
              >
                {loading
                  ? "Cleaning up..."
                  : "Clear Auth Data & Redirect to Login"}
              </Button>

              <Button onClick={handleBypassAuth} variant="outline">
                Use Development Bypass
              </Button>

              <Button
                onClick={syncCookiesFromLocalStorage}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Syncing..." : "Sync Cookies from LocalStorage"}
              </Button>

              <Button
                onClick={syncLocalStorageFromCookies}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Syncing..." : "Sync LocalStorage from Cookies"}
              </Button>

              <Button
                onClick={forceAuthRefresh}
                disabled={loading}
                variant="outline"
              >
                {loading ? "Refreshing..." : "Force Auth Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
