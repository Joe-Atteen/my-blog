"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
// import { NewsletterSubscription } from "@/components/ui/newsletter-subscription";
import { SupabaseImage } from "@/components/ui/supabase-image";
import { createBrowserClient } from "@/app/supabase-browser";
import { Post } from "@/lib/types";

export function HomePosts() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setFeaturedPosts(data || []);

        // Create a unique channel name for this component instance
        const channelName = `public-posts-home-${Math.random()
          .toString(36)
          .slice(2, 11)}`;

        // Set up real-time subscription for posts table with specific handlers for each event type
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
              console.log("New post detected on homepage:", payload.new);
              // Add the new post and keep only the first 3
              setFeaturedPosts((current) => {
                const newPosts = [payload.new as Post, ...current].slice(0, 3);
                return newPosts;
              });
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
              console.log("Post updated on homepage:", payload.new);
              // Update the post if it's in our featured list
              setFeaturedPosts((current) =>
                current.map((post) =>
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
              console.log("Post deleted on homepage:", payload.old);
              // Remove deleted post and fetch one more to replace it if needed
              setFeaturedPosts((current) => {
                const filteredPosts = current.filter(
                  (post) => post.id !== payload.old.id
                );
                if (filteredPosts.length < current.length) {
                  // If we removed a post, fetch a new one to maintain 3 posts
                  fetchPosts();
                }
                return filteredPosts;
              });
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
  }, [supabase]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-3xl font-bold mb-6">Latest Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card animate-pulse rounded-lg p-6 h-64"
              ></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-bold mb-6">Latest Posts</h2>
        {featuredPosts.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No posts available yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {post.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <SupabaseImage
                      src={post.image_url}
                      alt={post.title}
                      width={400}
                      height={225}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {format(new Date(post.created_at), "MMMM d, yyyy")}
                  </p>
                  <Link href={`/posts/${post.slug}`}>
                    <Button size="sm" variant="outline">
                      Read More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {featuredPosts.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/posts">
              <Button variant="outline">View All Posts</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
