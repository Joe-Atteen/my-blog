"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

// Create context for session
type SessionContextType = {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  refreshSession: async () => {},
});

// Hook to use session
export const useSession = () => useContext(SessionContext);

// Session provider component
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);

      // First attempt to refresh the session explicitly
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (!refreshError && refreshData.session) {
        console.log("Session refreshed successfully");
        setSession(refreshData.session);
        return;
      }

      if (refreshError) {
        console.log(
          "Session refresh failed, falling back to getSession:",
          refreshError.message
        );
      }

      // Fall back to getSession
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setSession(null);
      } else {
        setSession(data.session);
      }
    } catch (e) {
      console.error("Unexpected error refreshing session:", e);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initialize session
  useEffect(() => {
    refreshSession();

    // Set up subscription for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_IN") {
        setSession(currentSession);
        toast.success("Signed in successfully!");

        // Re-save auth data in localStorage as a backup
        if (currentSession) {
          try {
            // We won't modify cookies directly here as Supabase should handle this
            // But we'll store the session data in localStorage as a backup
            localStorage.setItem(
              "sb-access-token",
              currentSession.access_token
            );
            localStorage.setItem(
              "sb-refresh-token",
              currentSession.refresh_token
            );
          } catch (e) {
            console.error("Error saving backup session data:", e);
          }
        }
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(currentSession);
        console.log("Token refreshed successfully");

        // Update backup storage on token refresh too
        if (currentSession) {
          try {
            localStorage.setItem(
              "sb-access-token",
              currentSession.access_token
            );
            localStorage.setItem(
              "sb-refresh-token",
              currentSession.refresh_token
            );
          } catch (e) {
            console.error("Error saving refreshed token data:", e);
          }
        }
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        toast.info("Signed out successfully");

        // Clean up any stored tokens
        try {
          localStorage.removeItem("sb-access-token");
          localStorage.removeItem("sb-refresh-token");
        } catch (e) {
          console.error("Error cleaning up tokens:", e);
        }
      }

      // Handle user update events
      if (event === "USER_UPDATED") {
        setSession(currentSession);
        console.log("User data updated");
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshSession]);

  return (
    <SessionContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}
