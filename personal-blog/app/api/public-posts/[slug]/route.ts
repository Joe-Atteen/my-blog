import { createServerClient } from "@/app/supabase-server";
import { NextResponse } from "next/server";
import { getReliableImageUrl } from "@/lib/server-image-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(request: Request, context: any) {
  const { slug } = context.params;

  if (!slug) {
    return NextResponse.json(
      { error: "Slug parameter is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerClient();

    // Fetch post by slug
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        posts_tags(
          tag_id,
          tags(id, name, slug)
        )
      `
      )
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      throw error;
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Process image URL to ensure it's absolute or signed
    if (post.image_url) {
      try {
        console.log("Original post image_url:", post.image_url);

        // Use our utility function to get a reliable URL
        post.image_url = await getReliableImageUrl(post.image_url);
        console.log("Generated reliable image URL for post:", post.image_url);
      } catch (err) {
        console.error("Error processing post image URL:", err);
      }
    }

    // Process tags from the nested structure
    const extractedTags = [];
    if (post.posts_tags && Array.isArray(post.posts_tags)) {
      for (const pt of post.posts_tags) {
        if (pt.tags) {
          extractedTags.push(pt.tags);
        }
      }
    }

    // Create a clean post object without the nested posts_tags structure
    const cleanPost = { ...post };

    // Create a modified post with tags
    const postWithTags = {
      ...cleanPost,
      tags: extractedTags,
    };

    // Use the modified post for the response

    // Dynamically set CORS origin
    const allowedOrigins = ["https://joeatteen.com", "http://localhost:5173"];
    const origin = request.headers.get("origin");
    const corsOrigin = allowedOrigins.includes(origin ?? "")
      ? origin ?? "https://joeatteen.com"
      : "https://joeatteen.com";

    return NextResponse.json(
      { post: postWithTags },
      {
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=60", // Cache for 60 seconds
        },
      }
    );
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function OPTIONS(request: Request) {
  const allowedOrigins = ["https://joeatteen.com", "http://localhost:5173"];
  const origin = request.headers.get("origin");
  const corsOrigin = allowedOrigins.includes(origin ?? "")
    ? origin ?? "https://joeatteen.com"
    : "https://joeatteen.com";

  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    }
  );
}
