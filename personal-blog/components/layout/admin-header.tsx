"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="hidden font-bold sm:inline-block">
              <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-xl font-extrabold text-transparent">
                Admin Dashboard
              </span>
            </span>
            <span className="text-xl font-bold sm:hidden">AD</span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href="/admin"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  View Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/manage-admins"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Manage Admins
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/debug"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Debug Session
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Admin Access</span>

          <Button asChild variant="ghost" className="mr-2">
            <Link href="/">Back to Blog</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
