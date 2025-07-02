"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/app/supabase-browser";
import Link from "next/link";

export default function DebugLogPage() {
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [session, setSession] = useState<{
    access_token: string;
    refresh_token: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();

      try {
        // Test getUser
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData.user);

        // Test getSession
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, []);

  const testAdminAccess = async () => {
    setLoading(true);
    try {
      // Simplified check similar to what middleware might be doing
      const result = await fetch("/api/test-admin-auth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await result.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Auth Status Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                <p className="font-medium text-green-800 dark:text-green-400">
                  ✅ Logged in as: {user.email}
                </p>
                <p className="text-sm mt-1">User ID: {user.id}</p>
                <p className="text-sm">Role: {user.role}</p>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                <p className="font-medium text-red-800 dark:text-red-400">
                  ❌ Not logged in
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth Session</CardTitle>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                <p className="font-medium text-green-800 dark:text-green-400">
                  ✅ Active session found
                </p>
                <details>
                  <summary className="cursor-pointer mt-2 mb-2">
                    View Session Details
                  </summary>
                  <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                <p className="font-medium text-red-800 dark:text-red-400">
                  ❌ No active session
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin-fix-auth">
                <Button className="w-full" variant="outline">
                  Auth Troubleshooter
                </Button>
              </Link>

              <Link href="/admin?bypass=true">
                <Button className="w-full" variant="outline">
                  Bypass (Dev Mode)
                </Button>
              </Link>
            </div>

            <Button
              onClick={testAdminAccess}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Test Admin Access"}
            </Button>

            {testResult && (
              <div className="mt-2">
                <h3 className="text-md font-medium mb-1">Test Result:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
                  {testResult}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
