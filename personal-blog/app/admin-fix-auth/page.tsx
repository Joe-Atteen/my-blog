"use client";

import { useEffect } from "react";
import FixAuthPage from "../debug-session/fix-auth";

export default function AdminFixAuthPage() {
  // Add logic to check if the user was redirected from admin page
  useEffect(() => {
    // Check the referrer to see if they came from admin
    const referrer = document.referrer;
    const cameFromAdmin = referrer.includes("/admin");

    if (cameFromAdmin) {
      // We could display a message here that they were redirected from admin
      console.log("Redirected from admin page due to auth issues");
    }
  }, []);

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Access Troubleshooter</h1>
      <p className="mb-4">
        This tool will help fix authentication issues preventing you from
        accessing the admin area.
      </p>

      <FixAuthPage />

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-500 mb-2">
          Still having issues?
        </h3>
        <p>
          Try using the &quot;Force Auth Refresh&quot; button above to refresh
          your authentication token, or the &quot;Use Development Bypass&quot;
          button if you&apos;re in development mode.
        </p>
      </div>
    </div>
  );
}
