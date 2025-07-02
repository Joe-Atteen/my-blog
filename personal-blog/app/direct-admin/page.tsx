"use client";

import { DirectLogin } from "@/components/ui/direct-login";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { Button } from "@/components/ui/button";

export default function DirectAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        if (!session) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        setIsLoggedIn(true);

        // Check if user is admin
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            setIsAdmin(false);
          } else {
            setIsAdmin(profile?.is_admin || false);
          }
        } catch (e) {
          console.error("Profile check error:", e);
          setIsAdmin(false);
        }

        setLoading(false);
      } catch (e) {
        console.error("Auth check error:", e);
        setIsLoggedIn(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Direct Admin Access</h1>

      {isLoggedIn ? (
        <div className="w-full space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <p className="text-green-800 dark:text-green-200">
              You are logged in!{" "}
              {isAdmin ? "And you are an admin." : "But you are not an admin."}
            </p>
          </div>

          {isAdmin && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Quick Access Links</h2>
              <div className="flex flex-col space-y-2">
                <Button onClick={() => (window.location.href = "/admin")}>
                  Go to Admin Dashboard
                </Button>
                <Button onClick={() => (window.location.href = "/admin/debug")}>
                  Go to Debug Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                >
                  Go to Home Page
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
          <DirectLogin />
        </div>
      )}
    </div>
  );
}
