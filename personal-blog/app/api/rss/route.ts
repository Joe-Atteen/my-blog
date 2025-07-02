import { createServerClient } from "@/app/supabase-server";
import { Post } from "@/lib/types";

function generateRssFeed(posts: Post[]) {
  const site_url =
    process.env.NEXT_PUBLIC_SITE_URL || "https://atteen-blog.vercel.app/";

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>My Blog</title>
  <description>A personal corner of the web where I share my thoughts, ideas, and discoveries.</description>
  <link>${site_url}</link>
  <atom:link href="${site_url}/rss.xml" rel="self" type="application/rss+xml" />
  ${posts
    .map((post) => {
      const pubDate = new Date(post.created_at).toUTCString();
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${site_url}/posts/${post.slug}</link>
      <guid isPermaLink="false">${post.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt || ""}]]></description>
    </item>`;
    })
    .join("")}
</channel>
</rss>`;
}

export async function GET() {
  const supabase = await createServerClient();

  // Fetch the published posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Generate RSS feed
  const rss = generateRssFeed(posts || []);

  // Return the RSS feed as XML
  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
