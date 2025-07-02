"use client";

import { useState } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function FixTokensPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  type DebugInfoType = {
    session?: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: unknown;
    };
    user?: { id: string; email: string; [key: string]: unknown };
    profile?: Record<string, unknown>;
    weakPassword?: unknown;
  };
  const [debugInfo, setDebugInfo] = useState<DebugInfoType | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing tokens first
      await clearTokens();

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store debug info
      if (data?.session && data?.user) {
        const sessionData = { ...data.session } as Record<string, unknown>;
        const userData = { ...data.user } as Record<string, unknown>;

        setDebugInfo({
          session: sessionData,
          user: {
            id: String(userData.id || ""),
            email: String(userData.email || ""),
            ...userData,
          },
          weakPassword: data?.weakPassword,
        });
      }

      // Save tokens explicitly
      if (data?.session) {
        await saveTokens(data.session);
        await checkProfile(data.user);
      }

      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Login failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const saveTokens = async (session: {
    access_token: string;
    refresh_token: string;
  }) => {
    try {
      // Save in localStorage
      localStorage.setItem("sb-access-token", session.access_token);
      localStorage.setItem("sb-refresh-token", session.refresh_token);

      // Set cookies manually
      document.cookie = `sb-access-token=${
        session.access_token
      }; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
      document.cookie = `sb-refresh-token=${
        session.refresh_token
      }; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days

      // Save with more secure method available in newer Supabase versions
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      console.log("Tokens saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving tokens:", error);
      return false;
    }
  };

  const clearTokens = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      localStorage.removeItem("supabase.auth.token");

      // Clear cookies
      document.cookie =
        "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Sign out from Supabase
      await supabase.auth.signOut();

      console.log("Tokens cleared successfully");
      return true;
    } catch (error) {
      console.error("Error clearing tokens:", error);
      return false;
    }
  };

  const checkProfile = async (user: { id?: string; email?: string }) => {
    if (!user?.id || !user?.email) return;

    try {
      // Check if profile exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          // Create profile
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              is_admin: user.email.toLowerCase() === "joeyatteen@gmail.com",
              created_at: new Date().toISOString(),
            })
            .select();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            return;
          }

          console.log("Profile created:", newProfile);
        } else {
          console.error("Error checking profile:", error);
        }
        return;
      }

      console.log("Profile found:", profile);

      // Ensure admin access for specific email
      if (
        user.email.toLowerCase() === "joeyatteen@gmail.com" &&
        !profile.is_admin
      ) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating admin status:", updateError);
          return;
        }

        console.log("Admin status updated");
      }
    } catch (error) {
      console.error("Error in profile check:", error);
    }
  };

  const checkTokens = () => {
    try {
      return {
        localStorage: {
          accessToken: localStorage.getItem("sb-access-token")
            ? "Present"
            : "Missing",
          refreshToken: localStorage.getItem("sb-refresh-token")
            ? "Present"
            : "Missing",
          legacyToken: localStorage.getItem("supabase.auth.token")
            ? "Present"
            : "Missing",
        },
        cookies: document.cookie
          .split(";")
          .filter((c) => c.trim().startsWith("sb-"))
          .map((c) => c.trim()),
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return { error: String(e) };
    }
  };

  const goToAdminPage = () => {
    window.location.href = "/admin";
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Fix Authentication Tokens
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Login with Token Fix</CardTitle>
          <CardDescription>
            This will properly set authentication tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
              {loading ? "Logging in..." : "Log In with Token Fix"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4 mb-6">
        <Button variant="outline" onClick={() => setShowTokens(!showTokens)}>
          {showTokens ? "Hide" : "Show"} Current Tokens
        </Button>

        <Button variant="outline" onClick={clearTokens}>
          Clear All Tokens
        </Button>
      </div>

      {showTokens && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Token Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(checkTokens(), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {debugInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Login Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              <strong>User ID:</strong> {debugInfo.user?.id}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {debugInfo.user?.email}
            </p>
            <p className="mb-2">
              <strong>Session:</strong> {debugInfo.session ? "Valid" : "None"}
            </p>

            <Button className="w-full mt-4" onClick={goToAdminPage}>
              Try Admin Access
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
