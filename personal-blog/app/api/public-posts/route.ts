import { createServerClient } from "@/app/supabase-server";
import { NextResponse } from "next/server";
import { getReliableImageUrl } from "@/lib/server-image-utils";

export async function GET(request: Request) {
  // Get query parameters
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "6", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const searchQuery = url.searchParams.get("search") || "";

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  try {
    const supabase = await createServerClient();

    // Build the base query for count
    let countQuery = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("published", true);

    // Add search functionality to count query if needed
    if (searchQuery) {
      countQuery = countQuery.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    // Build the main query for posts
    let query = supabase
      .from("posts")
      .select(
        `
        id, 
        title, 
        slug, 
        content, 
        image_url, 
        created_at, 
        updated_at,
        posts_tags(
          tag_id,
          tags(id, name, slug)
        )
      `
      )
      .eq("published", true)
      .order("created_at", { ascending: false });

    // Add search functionality if a search query is provided
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
      );
    }

    // Apply pagination
    const { data: posts, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      throw error;
    }

    // Process posts and generate signed URLs for images
    const processedPosts = await Promise.all(
      posts?.map(async (post) => {
        let imageUrl = post.image_url;

        // Generate a reliable URL if image_url exists
        if (post.image_url) {
          try {
            // Log the original image URL for debugging
            console.log("Original image_url:", post.image_url);

            // Use our utility function to get a reliable URL
            imageUrl = await getReliableImageUrl(post.image_url);
            console.log("Generated reliable image URL:", imageUrl);
          } catch (err) {
            console.error("Error processing image URL:", err);
            // Keep the original URL as fallback
          }
        }

        // Generate excerpt from content if needed
        const excerpt = post.content
          ? post.content
              .replace(/\s+/g, " ")
              .replace(/#|==|\*\*|__|\*|_|`|>/g, "")
              .trim()
              .substring(0, 160) + (post.content.length > 160 ? "..." : "")
          : ""; // Process tags from the nested structure
        // Extract tags for the response
        const extractedTags = [];
        if (post.posts_tags && Array.isArray(post.posts_tags)) {
          for (const pt of post.posts_tags) {
            if (pt.tags) {
              extractedTags.push(pt.tags);
            }
          }
        }

        // Create a clean post object without the nested posts_tags
        // Create a new post object without posts_tags
        const cleanPost = { ...post };

        return {
          ...cleanPost,
          image_url: imageUrl,
          excerpt,
          tags: extractedTags,
        };
      }) || []
    );

    // Return posts with pagination info
    return NextResponse.json(
      {
        posts: processedPosts,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      {
        headers: {
          // Configure CORS headers to allow access from other domains
          "Access-Control-Allow-Origin": "https://joeatteen.com/", // In production, replace with your portfolio domain
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=60", // Cache for 60 seconds
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "https://joeatteen.com/", // In production, replace with your portfolio domain
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    }
  );
}
