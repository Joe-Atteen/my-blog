"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

export default function LogoutPage() {
  const supabase = createBrowserClient();

  useEffect(() => {
    async function handleLogout() {
      try {
        // Clear all local storage used by Supabase
        localStorage.removeItem("sb-refresh-token");
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("supabase.auth.token");
        localStorage.removeItem("wasAdmin");
        console.log("Cleared all auth tokens from localStorage");

        // Then sign out
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        toast.success("Logged out successfully");
        // Use window.location for a full page refresh to ensure everything reloads
        window.location.href = "/";
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        toast.error("Logout failed: " + errorMessage);
        console.error("Logout error:", error);
        // Use window.location for a full page refresh to ensure everything reloads
        window.location.href = "/";
      }
    }

    handleLogout();
  }, [supabase]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-24 text-center">
      <p>Logging out...</p>
    </div>
  );
}
