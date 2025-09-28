import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { EditPostPageWrapper } from "../../components/edit-post-page-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Edit Post | Admin Dashboard",
    description: "Edit a blog post",
  };
}

// Adapting to Next.js generated types which expect params to be a Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  // Extract ID directly from params object
  const { id } = await params;

  // Use a separate function to fetch the post to ensure proper async handling
  async function getPost(postId: string) {
    const supabase = createServerClient();
    return await supabase.from("posts").select("*").eq("id", postId).single();
  }

  // Get post data
  const { data: post, error } = await getPost(id);

  if (error || !post) {
    notFound();
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      <EditPostPageWrapper post={post} />
    </div>
  );
}
