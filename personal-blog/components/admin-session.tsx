"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extendSession } from "@/lib/extend-session";
import { createBrowserClient } from "@/app/supabase-browser";
import { Session } from "@supabase/supabase-js";
import { userHasAdminAccess } from "@/lib/admin-auth";

export default function AdminSession() {
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Check session and expiration time
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      setSessionInfo(data.session);

      // Calculate time left if session exists
      if (data.session?.expires_at) {
        const expiresAt = data.session.expires_at;
        const expirationTime = new Date(expiresAt * 1000);
        const now = new Date();
        const timeLeftMs = expirationTime.getTime() - now.getTime();
        setTimeLeft(Math.floor(timeLeftMs / 1000));
      }
    };

    checkSession();

    // Refresh every minute
    const interval = setInterval(() => {
      checkSession();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format seconds into hours, minutes, seconds
  const formatTimeLeft = (seconds: number): string => {
    if (seconds < 0) return "Expired";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleExtendSession = async () => {
    setLoading(true);
    try {
      const result = await extendSession();

      if (result.success && result.session) {
        // Update the session info
        setSessionInfo(result.session);

        // Calculate new time left
        if (result.session?.expires_at) {
          const expiresAt = result.session.expires_at;
          const expirationTime = new Date(expiresAt * 1000);
          const now = new Date();
          const timeLeftMs = expirationTime.getTime() - now.getTime();
          setTimeLeft(Math.floor(timeLeftMs / 1000));
        }

        alert("Session successfully extended!");
      } else {
        alert(`Failed to extend session: ${result.message}`);
      }
    } catch (error) {
      console.error("Error extending session:", error);
      alert("An error occurred while extending the session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Session</CardTitle>
      </CardHeader>
      <CardContent>
        {sessionInfo ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Session expires in:
                </p>
                <p className="text-2xl font-bold">
                  {timeLeft !== null
                    ? formatTimeLeft(timeLeft)
                    : "Calculating..."}
                </p>
              </div>
              <Button onClick={handleExtendSession} disabled={loading}>
                {loading ? "Extending..." : "Extend Session"}
              </Button>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                User:
              </p>
              <p>{sessionInfo.user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Admin Status:
              </p>
              <p className="flex items-center">
                {userHasAdminAccess(sessionInfo.user || {}) ? (
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-sm">
                    Authorized Admin
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-sm">
                    Not Authorized
                  </span>
                )}
              </p>
            </div>

            {timeLeft !== null && timeLeft < 600 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-400">
                  ⚠️ Your session expires soon! Click &quot;Extend Session&quot;
                  to continue working.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">
              No active session
            </p>
            <Button
              className="mt-4"
              onClick={() => (window.location.href = "/login")}
            >
              Log In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
