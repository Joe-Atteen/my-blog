"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { PostForm } from "./post-form";
import { Post, PostFormData } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
// Removed unused router import
import { toast } from "sonner";

interface EditPostProps {
  post: Post;
}

export function EditPost({ post }: EditPostProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Router no longer needed with real-time updates
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
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
