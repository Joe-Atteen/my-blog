import { notFound } from "next/navigation";
import { createServerClient } from "@/app/supabase-server";
import { Post } from "@/lib/types";
import { format } from "date-fns";
import MarkdownIt from "markdown-it";
import { CommentsSection } from "@/components/ui/comments-section";
import { CommentsList } from "@/components/ui/comments-list";
import { SocialShare } from "@/components/ui/social-share";
import { RelatedPosts } from "@/components/ui/related-posts";
import { generateSEO } from "@/lib/seo";
import { Metadata } from "next";
import { SupabaseImage } from "@/components/ui/supabase-image";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Fetch the post
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourblog.com";

  return generateSEO({
    title: post.title,
    description: post.excerpt || `Read ${post.title} on My Blog`,
    url: `${siteUrl}/posts/${post.slug}`,
    publishedTime: post.created_at,
    ogImage: post.image_url,
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Fetch the post
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) {
    notFound();
  }

  const { title, content, created_at } = post as Post;
  const formattedDate = format(new Date(created_at), "MMMM d, yyyy");

  // Parse markdown content
  const compiledSource = await (async () => {
    try {
      // Convert markdown to HTML using markdown-it
      const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      });
      return md.render(content);
    } catch (error) {
      console.error("Error compiling markdown:", error);
      return "Error rendering content";
    }
  })();

  return (
    <article className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">Published on {formattedDate}</p>
          <SocialShare
            title={title}
            url={`${
              process.env.NEXT_PUBLIC_SITE_URL || "https://yourblog.com"
            }/posts/${slug}`}
          />
        </div>

        {post.image_url && (
          <div className="aspect-video w-full relative mb-6 rounded-lg overflow-hidden">
            <SupabaseImage
              src={post.image_url}
              alt={title}
              fill={true}
              className="w-full"
            />
          </div>
        )}
      </header>

      <div className="prose prose-slate max-w-none">
        <div dangerouslySetInnerHTML={{ __html: compiledSource }} />
      </div>

      {/* Comments Section */}
      <div className="mt-10 pt-10 border-t">
        <CommentsSection postId={post.id} CommentsList={CommentsList} />
      </div>

      {/* Related Posts */}
      <div className="mt-10">
        <RelatedPosts currentPostId={post.id} />
      </div>
    </article>
  );
}
