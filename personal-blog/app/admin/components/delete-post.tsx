"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { Post } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
// Removed unused router import
import { toast } from "sonner";

interface DeletePostProps {
  post: Post;
}

export function DeletePost({ post }: DeletePostProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Router no longer needed with real-time updates
  const supabase = createBrowserClient();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Delete the post from the database
      const { error } = await supabase.from("posts").delete().eq("id", post.id);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      setOpen(false);
      // No need to call router.refresh() as real-time subscription will update the UI
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to delete post: " + errorMessage);
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{post.title}&quot;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
