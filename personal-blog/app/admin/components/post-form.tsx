"use client";

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
import Editor from "@/components/ui/markdown-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { PostFormData } from "@/lib/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  image_url: z.string().optional(),
  excerpt: z.string().optional(),
  published: z.boolean(),
});

interface PostFormProps {
  onSubmit: (data: PostFormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues: {
    title: string;
    content: string;
    image_url?: string;
    published: boolean;
  };
}

export function PostForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: PostFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title,
      content: defaultValues.content,
      image_url: defaultValues.image_url || "",
      published: defaultValues.published,
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await onSubmit({
      title: data.title,
      content: data.content,
      image_url: data.image_url,
      published: data.published,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 overflow-y-scroll max-h-dvh"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Editor value={field.value} fieldChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                  id="published-checkbox"
                  aria-label="Publish post"
                  title="Publish post"
                />
              </FormControl>
              <FormLabel htmlFor="published-checkbox" className="font-normal">
                Publish post (it will be visible to everyone)
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues.title ? "Update Post" : "Create Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
