"use client";

import { Button } from "@/components/ui/button";

/**
 * A utility component for development to help with authentication debug and bypass
 */
export default function AuthDebugHelper() {
  const activateBypass = () => {
    // Add bypass to current URL and reload
    const currentUrl = window.location.href;
    const separator = currentUrl.includes("?") ? "&" : "?";
    window.location.href = `${currentUrl}${separator}bypass=true`;
  };

  const goToLogin = () => {
    window.location.href = "/login";
  };

  const goToAdminWithBypass = () => {
    window.location.href = "/admin?bypass=true";
  };

  const clearStorage = () => {
    // Clear auth-related items
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
        console.error(`Failed to remove ${key}:`, e);
      }
    });

    // Clear auth cookies
    document.cookie =
      "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    alert("Auth storage cleared");
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 rounded-lg shadow-lg z-50 text-white">
      <h3 className="text-sm font-bold mb-2">Auth Debug Tools</h3>
      <div className="flex flex-col space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={activateBypass}
          className="text-xs"
        >
          Add Bypass to URL
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={goToAdminWithBypass}
          className="text-xs"
        >
          Go to Admin (Bypass)
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={goToLogin}
          className="text-xs"
        >
          Go to Login
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={clearStorage}
          className="text-xs"
        >
          Clear Auth Storage
        </Button>
        <p className="text-xs opacity-70 mt-2">
          Dev tools only - remove in production
        </p>
      </div>
    </div>
  );
}
