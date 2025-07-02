"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/app/supabase-browser";
import { Post } from "@/lib/types";

export function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowResults(true);

        try {
          // Search for posts with titles or content containing the search query
          const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("published", true)
            .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
            .order("created_at", { ascending: false })
            .limit(5);

          if (error) throw error;
          setSearchResults(data || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setShowResults(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, supabase]);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="search"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-8"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <SearchIcon size={16} />
          )}
        </div>
      </div>

      {showResults && searchQuery.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background py-1 shadow-lg">
          {isSearching ? (
            <div className="px-4 py-2 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  onClick={() => setShowResults(false)}
                  className="block px-4 py-2 hover:bg-secondary"
                >
                  <div className="text-sm font-medium">{post.title}</div>
                </Link>
              ))}
              <div className="border-t border-border px-4 py-2 text-center">
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  onClick={() => setShowResults(false)}
                >
                  <Link href={`/posts?q=${encodeURIComponent(searchQuery)}`}>
                    See all results
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-2 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
