"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authorizedAdminEmails, isAuthorizedAdmin } from "@/lib/admin-auth";
import { createBrowserClient } from "@/app/supabase-browser";
import { User } from "@supabase/supabase-js";

export default function ManageAdminsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [message, setMessage] = useState("");
  const [admins, setAdmins] = useState<string[]>(authorizedAdminEmails);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUser(data.user);
        setIsCurrentUserAdmin(isAuthorizedAdmin(data.user.email));
      }
    };

    checkUser();
  }, []);

  // This function would normally update the database
  // Since we're using a static config file, this is just for demonstration
  const handleAddAdmin = () => {
    if (!newAdminEmail) {
      setMessage("Please enter an email address");
      return;
    }

    if (admins.includes(newAdminEmail)) {
      setMessage("This email is already an admin");
      return;
    }

    // In a real application, this would update the database
    setAdmins([...admins, newAdminEmail]);
    setMessage(
      `Added ${newAdminEmail} to admin list (demo only - to make this permanent, update lib/admin-auth.ts)`
    );
    setNewAdminEmail("");
  };

  const handleRemoveAdmin = (email: string) => {
    if (email === currentUser?.email) {
      setMessage("You cannot remove yourself as an admin");
      return;
    }

    // In a real application, this would update the database
    setAdmins(admins.filter((admin) => admin !== email));
    setMessage(
      `Removed ${email} from admin list (demo only - to make this permanent, update lib/admin-auth.ts)`
    );
  };

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Manage Admin Access</CardTitle>
          <CardDescription>
            Since your Supabase setup doesn&apos;t have custom roles, admin
            access is managed via email addresses. To make permanent changes,
            update the authorizedAdminEmails array in lib/admin-auth.ts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCurrentUserAdmin ? (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md mb-6">
                <p className="font-medium text-green-800 dark:text-green-400">
                  ✅ You have admin access
                </p>
                <p className="text-sm mt-1">
                  Your email ({currentUser?.email}) is on the admin list
                </p>
              </div>

              {message && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-blue-800 dark:text-blue-400">{message}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-3">Current Admins</h3>
                <ul className="space-y-2">
                  {admins.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
                    >
                      <span>{email}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAdmin(email)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Add New Admin</h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                  <Button onClick={handleAddAdmin}>Add</Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Note: This is a demo interface. In a real application, you
                  would update the database.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
              <p className="font-medium text-amber-800 dark:text-amber-400">
                ⚠️ You don&apos;t have admin access
              </p>
              <p className="mt-2">
                Your email ({currentUser?.email}) is not on the admin list. You
                need to be an admin to manage admin users.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex justify-end w-full">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin")}
            >
              Back to Admin
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
