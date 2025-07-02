"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createBrowserClient } from "@/app/supabase-browser";
import { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SupabaseImage } from "@/components/ui/supabase-image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PostsGrid() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 9; // Number of posts per page
  const supabase = createBrowserClient();

  useEffect(() => {
    // Get the current URL search params
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get("page");
    const searchParam = urlParams.get("q");

    if (pageParam) {
      setPage(parseInt(pageParam, 10));
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Function to update the URL with the current page and search query
  const updateUrl = useCallback((newPage: number, query?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", newPage.toString());

    if (query !== undefined) {
      if (query) {
        url.searchParams.set("q", query);
      } else {
        url.searchParams.delete("q");
      }
    }

    window.history.pushState({}, "", url.toString());
  }, []);

  // Function to handle page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateUrl(newPage);
    },
    [updateUrl]
  );

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    async function fetchPosts() {
      try {
        setLoading(true);

        // Calculate the range for pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // First, get the total count for pagination
        let countQuery = supabase
          .from("posts")
          .select("id", { count: "exact" })
          .eq("published", true);

        if (searchQuery) {
          countQuery = countQuery.or(
            `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
          );
        }

        const { count, error: countError } = await countQuery;

        if (countError) throw countError;
        setTotalPosts(count || 0);

        // Then, fetch the posts for the current page
        let query = supabase
          .from("posts")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (searchQuery) {
          query = query.or(
            `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        setPosts(data || []);

        // Set up real-time subscription with a unique channel name
        const channelName = `public-posts-grid-${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "posts",
              filter: "published=eq.true",
            },
            (payload) => {
              console.log("New post detected:", payload.new);

              // Only update if it would appear on the current page (first page)
              if (page === 1) {
                setPosts((currentPosts) => {
                  // Add at the beginning and maintain pageSize
                  const updatedPosts = [payload.new as Post, ...currentPosts];
                  if (updatedPosts.length > pageSize) {
                    updatedPosts.pop(); // Remove last item to maintain page size
                  }
                  return updatedPosts;
                });
                // Update total posts count for pagination
                setTotalPosts((current) => current + 1);
              } else {
                // If not on first page, just update the count
                setTotalPosts((current) => current + 1);
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "posts",
              filter: "published=eq.true",
            },
            (payload) => {
              console.log("Post updated:", payload.new);

              // Update the post in the current list if it exists
              setPosts((currentPosts) =>
                currentPosts.map((post) =>
                  post.id === payload.new.id ? (payload.new as Post) : post
                )
              );
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "posts",
            },
            (payload) => {
              console.log("Post deleted:", payload.old);

              // Remove from current list and update count
              setPosts((currentPosts) =>
                currentPosts.filter((post) => post.id !== payload.old.id)
              );
              setTotalPosts((current) => Math.max(0, current - 1));

              // If this makes the current page empty and it's not the first page, go back
              if (page > 1 && posts.length <= 1) {
                handlePageChange(page - 1);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [page, searchQuery, pageSize, supabase, handlePageChange, posts.length]);

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const query = formData.get("search") as string;
      setSearchQuery(query);
      setPage(1);
      updateUrl(1, query);
    },
    [updateUrl]
  );

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card animate-pulse rounded-lg p-6 h-64"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalPosts / pageSize);

  return (
    <div className="container mx-auto max-w-5xl px-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search posts..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            No posts found. Try a different search term.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col h-full border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.image_url && (
                  <div className="aspect-video overflow-hidden relative">
                    <SupabaseImage
                      src={post.image_url}
                      alt={post.title}
                      width={400}
                      height={225}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-grow p-5">
                  <h2 className="text-xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  <time
                    className="text-sm text-muted-foreground mb-3"
                    dateTime={post.created_at}
                  >
                    {format(new Date(post.created_at), "MMMM d, yyyy")}
                  </time>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt || post.content.substring(0, 150) + "..."}
                  </p>
                  <div className="mt-auto">
                    <Link href={`/posts/${post.slug}`}>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => page > 1 && handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <span className="sr-only">Previous Page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    page < totalPages && handlePageChange(page + 1)
                  }
                  disabled={page >= totalPages}
                >
                  <span className="sr-only">Next Page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
