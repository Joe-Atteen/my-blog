"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";
import { PostForm } from "../components/post-form"; // Adjust the import path as necessary
import { PostFormData } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
// Removed unused router import
import { v4 as uuid } from "uuid";
import slugify from "slugify";
import { toast } from "sonner";

interface CreatePostProps {
  userId: string;
}

export function CreatePost({ userId }: CreatePostProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Router no longer needed with real-time updates
  const supabase = createBrowserClient();

  const handleSubmit = async (data: PostFormData) => {
    try {
      setIsSubmitting(true);

      // Generate a slug from the title
      const slug = slugify(data.title, { lower: true, strict: true });

      // Insert the post into the database
      const { error } = await supabase
        .from("posts")
        .insert({
          id: uuid(),
          title: data.title,
          slug,
          content: data.content,
          image_url: data.image_url || null,
          published: data.published,
          author_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Post created successfully!");
      // No need to call router.refresh() as real-time subscription will update the UI
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error("Failed to create post: " + error.message);
        console.error(error);
      } else {
        toast.error("Failed to create post: Unknown error");
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="create-post">
        <AccordionTrigger>
          <Button className="mr-2">
            <Plus className="h-4 w-4 mr-1" /> Create New Post
          </Button>
        </AccordionTrigger>
        <AccordionContent>
          <PostForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            defaultValues={{
              title: "",
              content: "",
              image_url: "",
              published: false,
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
