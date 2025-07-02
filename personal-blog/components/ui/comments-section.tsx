"use client";

import { useState } from "react";
import { CommentForm } from "./comment-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CommentsSection({
  postId,
  CommentsList,
}: {
  postId: string;
  CommentsList: React.ComponentType<{
    postId: string;
    refreshTrigger?: number;
  }>;
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommentSubmitted = () => {
    // Only use the local refresh trigger - no need for router.refresh()
    // since we're using real-time subscriptions in the CommentsList component
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Comments</h2>
      <CommentForm
        postId={postId}
        onCommentSubmitted={handleCommentSubmitted}
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        }
      >
        <CommentsList postId={postId} refreshTrigger={refreshTrigger} />
      </Suspense>
    </div>
  );
}
