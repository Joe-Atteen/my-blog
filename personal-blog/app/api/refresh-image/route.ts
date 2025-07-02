import { NextResponse } from "next/server";
import { getReliableImageUrl } from "@/lib/server-image-utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const imagePath = url.searchParams.get("path");

  if (!imagePath) {
    return NextResponse.json(
      { error: "Image path is required" },
      { status: 400 }
    );
  }

  console.log("Attempting to refresh URL for image path:", imagePath);

  try {
    // Use our utility function to generate a reliable URL
    const freshImageUrl = await getReliableImageUrl(imagePath);
    console.log("Generated fresh image URL:", freshImageUrl);

    if (freshImageUrl) {
      return NextResponse.json(
        { url: freshImageUrl },
        {
          headers: {
            "Access-Control-Allow-Origin": "https://joeatteen.com/", // In production, replace with your portfolio domain
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "no-cache",
          },
        }
      );
    } else {
      // If getReliableImageUrl didn't return a URL, return an error
      return NextResponse.json(
        {
          error: "Could not generate a valid image URL",
          originalPath: imagePath,
        },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "https://joeatteen.com/",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "no-cache",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error refreshing image URL:", error);
    return NextResponse.json(
      { error: "Failed to refresh image URL" },
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
