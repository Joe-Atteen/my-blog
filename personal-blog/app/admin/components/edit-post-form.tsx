"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PostForm } from "./post-form";
import { Post, PostFormData } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

interface EditPostFormProps {
  post: Post;
  onClose: () => void;
}

export function EditPostForm({ post, onClose }: EditPostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createBrowserClient();

  const handleSubmit = async (data: PostFormData) => {
    try {
      setIsSubmitting(true);

      // Update the post in the database
      const { error } = await supabase
        .from("posts")
        .update({
          title: data.title,
          content: data.content,
          image_url: data.image_url || null,
          published: data.published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post updated successfully!");
      onClose(); // Close the edit form
      // No need to call router.refresh() as real-time subscription will update the UI
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to update post: " + errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/50 border-t">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Post</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <PostForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultValues={{
            title: post.title,
            content: post.content,
            image_url: post.image_url,
            published: post.published,
          }}
        />
      </div>
    </div>
  );
}
