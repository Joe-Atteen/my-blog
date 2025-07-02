"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClearTokensPage() {
  useEffect(() => {
    const clearTokensAndRedirect = async () => {
      const supabase = createBrowserClient();

      try {
        // Clear localStorage
        console.log("Clearing localStorage tokens...");
        localStorage.removeItem("sb-refresh-token");
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("supabase.auth.token");

        // Clear cookies
        console.log("Clearing cookies...");
        document.cookie =
          "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Sign out from Supabase
        console.log("Signing out from Supabase...");
        await supabase.auth.signOut();

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "/fix-tokens";
        }, 2000);
      } catch (error) {
        console.error("Error clearing tokens:", error);

        // Redirect anyway after a delay
        setTimeout(() => {
          window.location.href = "/fix-tokens?error=true";
        }, 3000);
      }
    };

    clearTokensAndRedirect();
  }, []);

  return (
    <div className="container mx-auto max-w-md py-20">
      <Card>
        <CardHeader>
          <CardTitle>Clearing Authentication Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            Clearing all authentication tokens and sessions...
          </p>
          <p className="text-center text-sm text-gray-500">
            You will be redirected to the login page in a moment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
