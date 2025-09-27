"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
import { PostList } from "./components/post-list";
import { CreatePost } from "./components/create-post";
import { toast } from "sonner";

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Create a unique channel name with a random ID to prevent conflicts
    const channelName = `posts-changes-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    async function fetchPosts() {
      try {
        // Fetch posts without creating a subscription
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setPosts(data || []);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        toast.error("Failed to load posts: " + errorMessage);
        console.error("Error fetching posts:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    async function checkUserAndSetUpSubscription() {
      try {
        // Get current user session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (isMounted) {
            setUserId(user.id);
          }

          // Fetch initial posts
          await fetchPosts();

          // Set up real-time subscription for posts table
          // Subscribe to ALL events on posts table with one listener for better performance
          subscription = supabase
            .channel(channelName)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "posts" },
              (payload) => {
                console.log("Post change detected:", payload);

                if (!isMounted) return;

                if (payload.eventType === "INSERT") {
                  // Add new post to the beginning of the list
                  setPosts((currentPosts) => [
                    payload.new as Post,
                    ...currentPosts,
                  ]);
                  toast.success(`Post "${payload.new.title}" has been added!`);
                } else if (payload.eventType === "UPDATE") {
                  // Update the modified post in the list
                  setPosts((currentPosts) =>
                    currentPosts.map((post) =>
                      post.id === payload.new.id ? (payload.new as Post) : post
                    )
                  );
                  toast.success(
                    `Post "${payload.new.title}" has been updated!`
                  );
                } else if (payload.eventType === "DELETE") {
                  // Remove the deleted post from the list
                  setPosts((currentPosts) =>
                    currentPosts.filter((post) => post.id !== payload.old.id)
                  );
                  toast.success("Post has been deleted!");
                }
              }
            )
            .subscribe((status) => {
              console.log(`Supabase subscription status: ${status}`);
            });
        } else {
          // If no user session, redirect to login
          window.location.href = "/login";
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        toast.error("Failed to authenticate: " + errorMessage);
        console.error("Authentication error:", error);
      }
    }

    // Start the setup process
    checkUserAndSetUpSubscription();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 pb-10">

      <div className="mb-10 max-w-[900px] mx-auto">
        {userId && <CreatePost userId={userId} />}
      </div>

      <PostList posts={posts} />
    </div>
  );
}
