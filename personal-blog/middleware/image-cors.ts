"use client";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware that adds CORS headers specifically for Supabase image requests
 * This helps when browsers block image loading due to CORS issues
 */
export function middleware(request: NextRequest) {
  // Check if this is an image request from our Supabase storage
  const url = request.nextUrl.toString();

  // Only handle Supabase storage URLs
  if (
    url.includes("supabase") &&
    url.includes("/storage/") &&
    (url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".gif") ||
      url.endsWith(".webp") ||
      url.endsWith(".svg") ||
      url.endsWith(".JPG") ||
      url.endsWith(".JPEG") ||
      url.endsWith(".PNG") ||
      url.endsWith(".GIF") ||
      url.endsWith(".WEBP"))
  ) {
    console.log("Adding CORS headers to Supabase image request:", url);

    // Determine allowed origins
    const allowedOrigins = ["https://joeatteen.com", "http://localhost:5173"];
    const origin = request.headers.get("origin");
    const corsOrigin: string = allowedOrigins.includes(origin ?? "")
      ? origin ?? "https://joeatteen.com"
      : "https://joeatteen.com";

    // Get the response
    const response = NextResponse.next();

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return response;
  }

  // For all other requests, proceed normally
  return NextResponse.next();
}

export const config = {
  // This middleware only runs for Supabase storage URLs
  matcher: [
    "/:path*/storage/:path*",
    "/:path*/znphqmblusltnxhsbdnt.supabase.co/:path*",
    "/:path*/znphqmblusltnxhsbdnt.supabase.in/:path*",
  ],
};
