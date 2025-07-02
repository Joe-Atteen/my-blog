"use server";

import { cookies } from "next/headers";

/**
 * Sets appropriate cache headers based on route type
 */
export async function setCacheHeaders(
  response: Response,
  routeType: "static" | "dynamic" | "api"
): Promise<Response> {
  const headers = new Headers(response.headers);

  switch (routeType) {
    case "static":
      // Static pages (like /about, homepage)
      headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400"); // 1 hour client, 24 hours CDN
      break;

    case "dynamic":
      // Dynamic pages (like post detail pages)
      headers.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=60"
      ); // 5 minutes client, 1 hour CDN
      break;

    case "api":
      // API routes
      headers.set("Cache-Control", "no-cache, no-store"); // Default to no caching for API routes
      break;
  }

  // If the user is logged in, don't cache
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("sb-access-token");
    if (authCookie) {
      headers.set("Cache-Control", "no-cache, private");
    }
  } catch (error) {
    console.error("Error checking auth cookie:", error);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}
