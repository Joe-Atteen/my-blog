"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { Button } from "@/components/ui/button";
import { StorageBucketTester } from "@/components/ui/storage-bucket-tester";
import { ImageDebugger } from "@/components/ui/image-debugger";
import { ImageFixer } from "@/components/ui/image-fixer";
import { ImagePathFixer } from "@/components/ui/image-path-fixer";
import { fixAuthIssues } from "@/lib/fix-auth";
import ImageDebug from "./image-debug";

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<unknown | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function getSessionInfo() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Debug page - session:", session);
      setSessionInfo(session);
    }

    getSessionInfo();
  }, [supabase]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Session Debug</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Authentication Tools</h2>
        <div className="flex items-center space-x-4 mb-4">
          <Button
            onClick={() => fixAuthIssues()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Fix Authentication Issues
          </Button>
          <Button
            onClick={() => (window.location.href = "/login")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Login Page
          </Button>
          <Button
            onClick={() => (window.location.href = "/debug-session")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Session Debugger
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          If you&apos;re experiencing authentication issues, click the red
          button to clear all auth data and redirect to login.
        </p>
      </section>

      {sessionInfo ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto mb-4">
          <pre className="text-xs">{JSON.stringify(sessionInfo, null, 2)}</pre>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md mb-8">
          <p className="text-yellow-800 dark:text-yellow-200">
            No active session found. You may need to log in again.
          </p>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Image Diagnostics</h2>
        <ImageFixer />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Storage Diagnostics</h2>
        <StorageBucketTester />
        <ImageDebugger />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Image Path Fixer</h2>
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <ImagePathFixer />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Post Image URL Debugger</h2>
        <ImageDebug />
      </section>
    </div>
  );
}
