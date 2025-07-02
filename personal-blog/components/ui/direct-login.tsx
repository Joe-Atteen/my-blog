"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

/**
 * Direct Login Component - bypasses middleware issues
 * Use this for a one-time login to fix auth issues
 */
export function DirectLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  // Clear any existing auth data first
  const clearAuthData = () => {
    try {
      // Clear localStorage
      localStorage.removeItem("sb-refresh-token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("supabase.auth.token");

      // Clear cookies
      document.cookie =
        "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Also force sign out
      supabase.auth
        .signOut()
        .catch((e) => console.error("Error during sign out:", e));
    } catch (e) {
      console.error("Error clearing auth data:", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Clear existing auth data first
      clearAuthData();

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Perform login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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

          console.log("Auth tokens manually saved");
        }
      } catch (storageError) {
        console.error("Error storing tokens:", storageError);
      }

      if (error) throw error;

      console.log("Login successful");
      toast.success("Login successful!");

      // Check if user is admin
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .single();

        if (profile?.is_admin) {
          // Force direct navigation to admin page
          toast.success("Redirecting to admin page...");

          // Use a timeout to ensure cookies are set
          setTimeout(() => {
            // Force direct navigation with no middleware check
            window.location.href = "/admin";
          }, 1000);
        } else {
          // Non-admin user - go to homepage
          console.log("Non-admin login");
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct Admin Login</CardTitle>
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
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
