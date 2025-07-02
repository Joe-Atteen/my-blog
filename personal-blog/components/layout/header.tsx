import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="hidden font-bold sm:inline-block">
              <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-xl font-extrabold text-transparent">
                My Blog
              </span>
            </span>
            <span className="text-xl font-bold sm:hidden">MB</span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href="/"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/posts"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Blog Posts
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Search component */}
          <div className="hidden md:block w-64">
            <Search />
          </div>

          {/* Theme toggle */}
          <div className="mr-2">
            <ThemeToggle />
          </div>

          {/* Admin access */}
          <Button
            asChild
            variant="outline"
            className="hidden sm:inline-flex mr-2"
          >
            <Link href="/admin">Admin Dashboard</Link>
          </Button>

          <Button asChild variant="default" className="hidden sm:inline-flex">
            <Link href="/#newsletter">Subscribe</Link>
          </Button>

          <button className="cursor-pointer md:hidden" aria-label="Menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
