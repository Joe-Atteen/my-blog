import Link from "next/link";
// We need the Post type shape, but using it inline in relatedPosts
// import { Post } from "@/lib/types";
import { createServerClient } from "@/app/supabase-server";
import { format } from "date-fns";
import { SupabaseImage } from "@/components/ui/supabase-image";

interface RelatedPostsProps {
  currentPostId: string;
  limit?: number;
}

export async function RelatedPosts({
  currentPostId,
  limit = 3,
}: RelatedPostsProps) {
  const supabase = await createServerClient();

  // Fetch some recent posts excluding the current one
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .neq("id", currentPostId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!posts || posts.length === 0) {
    return null; // No related posts to show
  }

  return (
    <section className="mt-12 pt-12 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            href={`/posts/${post.slug}`}
            key={post.id}
            className="group block"
          >
            <article className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
              {post.image_url && (
                <div className="relative w-full h-36">
                  <SupabaseImage
                    src={post.image_url}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.created_at), "MMMM d, yyyy")}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
