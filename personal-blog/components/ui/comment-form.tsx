"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Using zod schema instead of imported type
// import { CommentFormData } from "@/lib/types";
import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  content: z.string().min(3, "Comment must be at least 3 characters"),
});

interface CommentFormProps {
  postId: string;
  onCommentSubmitted?: () => void;
}

export function CommentForm({ postId, onCommentSubmitted }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createBrowserClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      content: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Check if user is logged in
      const { data: session } = await supabase.auth.getSession();

      // Insert the comment and set it as approved
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: session?.session?.user?.id || null,
        name: data.name,
        email: data.email,
        content: data.content,
        approved: true, // Explicitly set approved to true
      });

      if (error) throw error;

      toast.success("Comment submitted successfully!");
      form.reset();

      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to submit comment: " + errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Leave a Comment</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your-email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts..."
                    className="min-h-[100px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Comment"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
