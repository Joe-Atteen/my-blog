"use client";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/app/supabase-browser";

export default function SessionDebugPage() {
  const { session, loading, refreshSession } = useSession();
  const [localStorageContents, setLocalStorageContents] = useState<
    Record<string, unknown>
  >({});
  const [cookiesContents, setCookiesContents] = useState<string>("");
  const [profile, setProfile] = useState<{
    id: string;
    email?: string;
    is_admin?: boolean;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get local storage auth items
    const getLocalStorage = () => {
      const items: Record<string, string | null> = {};

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if ((key && key.startsWith("sb-")) || key?.includes("supabase")) {
            items[key] = localStorage.getItem(key);
          }
        }
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }

      setLocalStorageContents(items);
    };

    // Get cookies
    const getCookies = () => {
      setCookiesContents(document.cookie);
    };

    getLocalStorage();
    getCookies();

    // Refresh periodically
    const interval = setInterval(() => {
      getLocalStorage();
      getCookies();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch profile data when session changes
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session || !session.user) {
        setProfile(null);
        return;
      }

      try {
        setProfileLoading(true);
        setProfileError(null);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfileError(err instanceof Error ? err.message : String(err));
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [session, supabase]);

  const clearAllAuth = async () => {
    try {
      // Clear localStorage
      Object.keys(localStorageContents).forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie =
          c.trim().split("=")[0] +
          "=;" +
          "expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      });

      // Sign out
      await supabase.auth.signOut();

      // Force reload
      window.location.reload();
    } catch (e) {
      console.error("Error clearing auth:", e);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Session Debug</h1>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Session Status</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Authenticated:</strong> {session ? "Yes" : "No"}
            </p>
          </div>

          {session && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <h3 className="font-bold mb-2 text-green-800 dark:text-green-300">
                Active Session Found
              </h3>
              <div className="overflow-auto max-h-64">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!session && !loading && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <h3 className="font-bold mb-2 text-yellow-800 dark:text-yellow-300">
                No Active Session
              </h3>
              <p>You are not currently logged in.</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button onClick={refreshSession}>Refresh Session</Button>
            <Button onClick={clearAllAuth} variant="destructive">
              Clear All Auth Data
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Local Storage (Auth Items)</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-64">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(localStorageContents, null, 2)}
            </pre>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Cookies</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-64">
            <pre className="text-xs whitespace-pre-wrap break-all">
              {cookiesContents || "No cookies found"}
            </pre>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Profile Information</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            {profileLoading ? (
              <p>Loading profile information...</p>
            ) : profileError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                <p className="text-red-700 dark:text-red-300">
                  Error: {profileError}
                </p>
              </div>
            ) : profile ? (
              <div>
                <p>
                  <strong>ID:</strong> {profile.id}
                </p>
                <p>
                  <strong>Email:</strong> {profile.email}
                </p>
                <p>
                  <strong>Admin Status:</strong>{" "}
                  <span
                    className={
                      profile.is_admin
                        ? "text-green-600 font-bold"
                        : "text-red-600"
                    }
                  >
                    {profile.is_admin ? "YES" : "NO"}
                  </span>
                </p>
                <div className="mt-4 overflow-auto max-h-64">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
                {!profile.is_admin && (
                  <Button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase
                          .from("profiles")
                          .update({ is_admin: true })
                          .eq("id", profile.id)
                          .select();

                        if (error) throw error;
                        setProfile(data[0]);
                        alert("Admin status updated successfully!");
                      } catch (e) {
                        alert("Failed to update admin status: " + e);
                      }
                    }}
                    className="mt-4"
                  >
                    Grant Admin Access
                  </Button>
                )}
              </div>
            ) : session ? (
              <div>
                <p>No profile found for this user.</p>
                <Button
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase
                        .from("profiles")
                        .insert({
                          id: session.user.id,
                          email: session.user.email,
                          is_admin: true,
                          created_at: new Date().toISOString(),
                        })
                        .select();

                      if (error) throw error;
                      setProfile(data[0]);
                      alert("Profile created successfully with admin access!");
                    } catch (e) {
                      alert("Failed to create profile: " + e);
                    }
                  }}
                  className="mt-4"
                >
                  Create Profile with Admin Access
                </Button>
              </div>
            ) : (
              <p>Not logged in. No profile information available.</p>
            )}
          </div>
        </section>

        <section className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">
            Admin Access Test
          </h2>
          <div className="flex space-x-4">
            <Button
              onClick={() => (window.location.href = "/admin")}
              className="bg-green-500 hover:bg-green-700 text-white"
            >
              Try Admin Dashboard
            </Button>
            <Button
              onClick={() => (window.location.href = "/admin?bypass=true")}
              className="bg-yellow-500 hover:bg-yellow-700 text-white"
            >
              Bypass Auth (Dev Mode)
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
