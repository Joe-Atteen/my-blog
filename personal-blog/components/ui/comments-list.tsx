"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
import { format } from "date-fns";
import { toast } from "sonner";

interface CommentsListProps {
  postId: string;
  refreshTrigger?: number;
}

export function CommentsList({
  postId,
  refreshTrigger = 0,
}: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Create a unique channel name for this component instance
    const channelName = `comments-${postId}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    async function fetchComments() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setComments(data || []);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchComments();

    // Set up real-time subscription for comments table
    subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("New comment inserted:", payload.new);
          // Only add if the comment is approved
          if (payload.new.approved && isMounted) {
            setComments((currentComments) => [
              payload.new as Comment,
              ...currentComments,
            ]);
            toast.info("New comment added");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("Comment updated:", payload.new);
          if (isMounted) {
            setComments((currentComments) =>
              currentComments.map((comment) =>
                comment.id === payload.new.id
                  ? (payload.new as Comment)
                  : comment
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("Comment deleted:", payload.old);
          if (isMounted) {
            setComments((currentComments) =>
              currentComments.filter((comment) => comment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [postId, supabase, refreshTrigger]);

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex gap-4 p-4 border rounded-md bg-card"
        >
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <span className="font-medium">{comment.name}</span>
              <span className="text-xs text-muted-foreground">
                {format(
                  new Date(comment.created_at),
                  "MMMM d, yyyy 'at' h:mm a"
                )}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
