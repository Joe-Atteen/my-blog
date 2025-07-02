"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Import the auth debug helper with no SSR to avoid document is not defined issues
const AuthDebugHelper = dynamic(
  () => import("@/components/auth-debug-helper"),
  { ssr: false }
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const supabase = createBrowserClient();

  // Check for existing tokens and display them
  const getAuthDebugInfo = () => {
    try {
      // Detailed localStorage check
      const refreshToken = localStorage.getItem("sb-refresh-token");
      const accessToken = localStorage.getItem("sb-access-token");
      const legacyToken = localStorage.getItem("supabase.auth.token");

      // Check cookie tokens with more detail
      const hasCookieRefreshToken =
        document.cookie.includes("sb-refresh-token");
      const hasCookieAccessToken = document.cookie.includes("sb-access-token");

      // Get URL search params to see if we came from an auth fix
      const urlParams = new URLSearchParams(window.location.search);
      const fromFix = urlParams.get("fixed") === "true";
      const hasError = urlParams.get("error") === "true";

      return {
        localStorage: {
          refreshToken: refreshToken ? "Present" : "Missing",
          accessToken: accessToken ? "Present" : "Missing",
          legacyToken: legacyToken ? "Present" : "Missing",
        },
        cookies: {
          refreshToken: hasCookieRefreshToken ? "Present" : "Missing",
          accessToken: hasCookieAccessToken ? "Present" : "Missing",
        },
        url: {
          fromFix,
          hasError,
        },
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      };
    } catch (e) {
      return {
        error: "Error checking tokens: " + String(e),
      };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Clear any existing tokens first
      try {
        localStorage.removeItem("sb-refresh-token");
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("supabase.auth.token");

        document.cookie =
          "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      } catch (e) {
        console.error("Error clearing tokens:", e);
      }

      // Login with proper session management
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Login successful");

      // Store session data manually as a backup strategy
      try {
        if (data?.session) {
          // Save session access token and refresh token to localStorage as a backup
          localStorage.setItem("sb-access-token", data.session.access_token);
          localStorage.setItem("sb-refresh-token", data.session.refresh_token);

          // Also manually set cookies
          document.cookie = `sb-access-token=${
            data.session.access_token
          }; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
          document.cookie = `sb-refresh-token=${
            data.session.refresh_token
          }; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
        }
      } catch (storageError) {
        console.error("Error storing tokens:", storageError);
      }

      // Check if user is admin
      if (data.user) {
        try {
          console.log("Checking admin status for user:", data.user.email);

          // First ensure the profile exists
          const profile = await ensureProfile(
            data.user.id,
            data.user.email || ""
          );

          if (!profile) {
            console.error("Could not get or create profile");
            toast.error("Could not verify admin status");
            // Show debug information
            console.log(
              "DEBUG: Auth session data:",
              JSON.stringify(data.session, null, 2)
            );
            // Fallback to home page on error
            window.location.href = "/debug-session?error=profile-missing";
            return;
          }

          console.log("Profile data:", JSON.stringify(profile, null, 2));

          // Explicitly log admin status for debugging
          console.log(`User admin status: ${profile.is_admin ? "YES" : "NO"}`);

          if (profile.is_admin) {
            // Admin user - go to admin dashboard
            toast.success("Welcome back, admin!");
            console.log("Admin login successful - redirecting to /admin");

            // Short delay to ensure toast is visible
            setTimeout(() => {
              window.location.href = "/admin";
            }, 500);
          } else {
            // Non-admin user - go to homepage
            console.log("Non-admin login");
            toast.success("Login successful!");
            window.location.href = "/";
          }
        } catch (profileCheckError) {
          console.error("Error during profile check:", profileCheckError);
          // Fallback to debug page on error
          toast.error("Error checking admin status");
          window.location.href = "/debug-session?error=profile-check-failed";
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Function to ensure the user profile exists
  const ensureProfile = async (userId: string, userEmail: string) => {
    try {
      console.log(
        `Ensuring profile for user ID: ${userId}, Email: ${userEmail}`
      );

      // First check if profile exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // PostgreSQL not found error
          console.log("Profile doesn't exist, creating new profile");

          // Always make joeyatteen@gmail.com an admin
          const isAdmin = userEmail.toLowerCase() === "joeyatteen@gmail.com";
          console.log(
            `Setting admin status to: ${
              isAdmin ? "YES" : "NO"
            } for ${userEmail}`
          );

          // Create the profile
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: userEmail,
              is_admin: isAdmin,
              created_at: new Date().toISOString(),
            })
            .select();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            return null;
          }

          console.log("New profile created:", newProfile?.[0]);
          return newProfile?.[0] || { is_admin: isAdmin };
        }

        console.error("Error checking profile:", error);
        return null;
      }

      // Check if we need to update the profile
      if (userEmail === "joeyatteen@gmail.com" && !profile.is_admin) {
        console.log("Updating admin status for primary admin user");

        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", userId)
          .select();

        if (updateError) {
          console.error("Error updating profile admin status:", updateError);
          return profile;
        }

        return updatedProfile?.[0] || profile;
      }

      return profile;
    } catch (e) {
      console.error("Exception in ensureProfile:", e);
      return null;
    }
  };

  // Add effect to check for URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("fixed") === "true") {
      toast.success("Authentication data has been cleared successfully");
    }
    if (urlParams.get("error") === "true") {
      toast.error("There was a problem with authentication");
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          console.log("User already logged in, checking admin status");

          // Check if user is admin
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile for logged in user:", error);
            return; // Stay on login page
          }

          console.log("Found existing profile:", profile);

          if (profile?.is_admin) {
            console.log("Admin already logged in, redirecting to admin");
            window.location.href = "/admin";
          } else {
            console.log("Non-admin already logged in, redirecting to home");
            window.location.href = "/";
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkCurrentSession();
  }, [supabase]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-10">
      {/* Auth Debug Helper - only shown in development */}
      {process.env.NODE_ENV !== "production" && <AuthDebugHelper />}

      <div className="w-full max-w-md space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <a
              href="/fix-tokens"
              className="text-blue-600 hover:underline text-sm"
            >
              Having trouble? Try Token Fix Login
            </a>

            <a
              href="/direct-admin"
              className="text-blue-600 hover:underline text-sm mt-2"
            >
              Try Direct Admin Access
            </a>

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-gray-500 hover:text-gray-700 text-xs mt-2"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>

            {showDebug && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs w-full">
                <h3 className="font-bold mb-1">Auth Debug Info:</h3>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(getAuthDebugInfo(), null, 2)}
                </pre>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
