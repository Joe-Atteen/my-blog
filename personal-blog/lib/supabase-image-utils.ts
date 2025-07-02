"use client";

import { createBrowserClient } from "@/app/supabase-browser";

// Get the bucket name from environment variables or fallback to default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

/**
 * Dedicated function to correctly handle Supabase image URLs
 * This handles signed URLs, public URLs, and path-only formats
 */
export async function getCorrectImageUrl(
  url: string | null | undefined
): Promise<string> {
  if (!url) return "";

  // Clean up the URL first (remove quotes, trim whitespace)
  url = url.trim().replace(/^["'](.+)["']$/, "$1");

  // Avoid excessive logging in production
  if (process.env.NODE_ENV !== "production") {
    console.log("Processing image URL:", url);
  }

  try {
    const supabase = createBrowserClient();

    // CASE 1: It's a simple path within the bucket (the ideal case)
    if (url.startsWith("blog/") || url.startsWith("post-images/")) {
      if (process.env.NODE_ENV !== "production") {
        console.log("URL is a storage path, generating public URL");
      }

      // First try standard URL format
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(url);

      // Try S3 format as an alternative without 'public' in the URL
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const s3Url = `${baseUrl}/storage/v1/object/${BUCKET_NAME}/${url}`;

      console.log("Standard URL:", data.publicUrl);
      console.log("S3 URL:", s3Url);

      // Use the S3 endpoint URL instead as it may work better
      const freshUrl = new URL(s3Url);

      if (process.env.NODE_ENV === "development") {
        freshUrl.searchParams.set("_cache", Date.now().toString());
      }
      return freshUrl.toString();
    }

    // CASE 2: It's a UUID filename with no prefix
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-zA-Z]+$/i.test(
        url
      )
    ) {
      // Try both blog/ and post-images/ prefixes
      const paths = [`blog/${url}`, `post-images/${url}`];

      for (const path of paths) {
        try {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Trying path: ${path}`);
          }
          const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);
          const freshUrl = new URL(data.publicUrl);
          if (process.env.NODE_ENV === "development") {
            freshUrl.searchParams.set("_cache", Date.now().toString());
          }
          return freshUrl.toString();
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.log(`Path ${path} failed, trying next option`);
          }
        }
      }

      // If we get here, use the default blog/ prefix as fallback
      if (process.env.NODE_ENV !== "production") {
        console.log("Using blog/ prefix as fallback");
      }
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`blog/${url}`);
      const freshUrl = new URL(data.publicUrl);
      if (process.env.NODE_ENV === "development") {
        freshUrl.searchParams.set("_cache", Date.now().toString());
      }
      return freshUrl.toString();
    }

    // CASE 3: It's a URL with the bucket name in it
    if (
      url.includes(`/storage/v1/object/${BUCKET_NAME}/`) ||
      url.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)
    ) {
      console.log("URL contains storage path, extracting path");

      // Extract the path from the URL - handle both with and without 'public'
      const pathMatchWithPublic = url.match(
        new RegExp(`/public/${BUCKET_NAME}/(.*)$`)
      );
      const pathMatchWithoutPublic = url.match(
        new RegExp(`/object/${BUCKET_NAME}/(.*)$`)
      );
      const pathMatch = pathMatchWithPublic || pathMatchWithoutPublic;
      if (pathMatch && pathMatch[1]) {
        const path = pathMatch[1].split("?")[0]; // Remove any query parameters
        console.log("IMPORTANT DEBUG - Extracted path from public URL:", path);

        // Re-generate a clean public URL using just the path
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        const freshUrl = new URL(data.publicUrl);
        freshUrl.searchParams.set("_cache", Date.now().toString());
        return freshUrl.toString();
      }
    }

    // CASE 4: Check for any Supabase URL format
    if (url.includes("supabase") && url.includes("/storage/")) {
      try {
        console.log("URL appears to be a Supabase URL, parsing components");

        // First try to extract path from URL structure
        const pathRegex =
          /\/storage\/v\d+\/(?:object|sign)\/(?:public|auth)\/[^/]+\/(.+?)(?:\?|$)/;
        const match = url.match(pathRegex);

        if (match && match[1]) {
          const extractedPath = match[1];
          console.log(
            "IMPORTANT DEBUG - Extracted path from Supabase URL:",
            extractedPath
          );

          // Check if path already has prefix
          let fullPath = extractedPath;
          if (
            !extractedPath.startsWith("blog/") &&
            !extractedPath.startsWith("post-images/")
          ) {
            fullPath = `blog/${extractedPath}`; // Add blog/ prefix as default
            console.log("Added blog/ prefix:", fullPath);
          }

          const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fullPath);

          const freshUrl = new URL(data.publicUrl);
          freshUrl.searchParams.set("_cache", Date.now().toString());
          return freshUrl.toString();
        }
      } catch (e) {
        console.error("Error parsing Supabase URL:", e);
      }
    }

    // CASE 5: If all else fails, try to use the URL as is
    console.log("Could not parse URL format, using as-is:", url);
    return url;
  } catch (error) {
    console.error("Error processing image URL:", error);

    // Return a placeholder image if we can't process the URL
    // Extract filename for adding to placeholder
    const filename = url?.split("/").pop() || "image";

    if (process.env.NODE_ENV === "development") {
      // In dev, use a descriptive placeholder
      return `https://placehold.co/600x400?text=Image+Error:+${encodeURIComponent(
        filename
      )}`;
    } else {
      // In production, use a more generic/professional placeholder
      return `https://picsum.photos/seed/${encodeURIComponent(
        filename
      )}/600/400`;
    }
  }
}

/**
 * Gets a direct download URL with cache busting for an image
 * Use this when normal public URLs fail
 */
export async function getDirectImageUrl(
  url: string | null | undefined
): Promise<string> {
  if (!url) return "";

  try {
    console.log("Getting direct download URL for:", url);

    // Extract path for logging/debugging purposes
    let path = url;

    if (url.includes(`/storage/`)) {
      // Handle various Supabase URL formats
      try {
        const pathRegex =
          /\/storage\/v\d+\/(?:object|sign)\/(?:public|auth)\/[^/]+\/(.+?)(?:\?|$)/;
        const match = url.match(pathRegex);

        if (match && match[1]) {
          path = match[1].split("?")[0];
          console.log("DIRECT URL DEBUG - Extracted path:", path);
        }
      } catch (e) {
        console.error("Error extracting path from URL:", e);
      }
    }

    // First get the regular URL through our enhanced handler
    const publicUrl = await getCorrectImageUrl(url);
    if (!publicUrl) return "";

    // Try to parse the URL and add direct download parameters
    try {
      // Add download param and cache busting
      const downloadUrl = new URL(publicUrl);
      downloadUrl.searchParams.set("download", "");
      downloadUrl.searchParams.set("cb", Date.now().toString());

      console.log("Generated direct download URL:", downloadUrl.toString());
      return downloadUrl.toString();
    } catch (e) {
      console.error("Error creating direct download URL:", e);
      return publicUrl; // Fall back to public URL
    }
  } catch (error) {
    console.error("Error getting direct image URL:", error);

    // Last resort - if it's a path try to generate a new URL
    if (url && (url.startsWith("blog/") || url.startsWith("post-images/"))) {
      try {
        const supabase = createBrowserClient();
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(url);
        const directUrl = new URL(data.publicUrl);
        directUrl.searchParams.set("download", "");
        directUrl.searchParams.set("cb", Date.now().toString());
        return directUrl.toString();
      } catch (e) {
        console.error("Final fallback attempt failed:", e);
      }
    }

    return url || "";
  }
}

/**
 * Debug utility to analyze image URL/path format
 * Returns information about the URL type and extracted path
 */
export function analyzeImageUrl(url: string | null | undefined): {
  type: "path" | "full-url" | "uuid-filename" | "unknown";
  originalUrl: string;
  extractedPath: string | null;
  suggestedPath: string | null;
  hasPrefix: boolean;
} {
  if (!url) {
    return {
      type: "unknown",
      originalUrl: url || "",
      extractedPath: null,
      suggestedPath: null,
      hasPrefix: false,
    };
  }

  // Case 1: Simple path
  if (url.startsWith("blog/") || url.startsWith("post-images/")) {
    return {
      type: "path",
      originalUrl: url,
      extractedPath: url,
      suggestedPath: url,
      hasPrefix: true,
    };
  }

  // Case 2: UUID filename without prefix
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]+$/i.test(
      url
    )
  ) {
    return {
      type: "uuid-filename",
      originalUrl: url,
      extractedPath: url,
      suggestedPath: `blog/${url}`,
      hasPrefix: false,
    };
  }

  // Case 3: Full Supabase URL
  if (
    url.includes("storage") &&
    (url.includes("supabase") || url.includes("object"))
  ) {
    try {
      // Extract path from URL
      const pathRegex =
        /\/storage\/v\d+\/(?:object|sign)\/(?:public|auth)\/[^/]+\/(.+?)(?:\?|$)/;
      const match = url.match(pathRegex);

      if (match && match[1]) {
        const path = match[1].split("?")[0];
        const hasPrefix =
          path.startsWith("blog/") || path.startsWith("post-images/");
        const suggestedPath = hasPrefix ? path : `blog/${path}`;

        return {
          type: "full-url",
          originalUrl: url,
          extractedPath: path,
          suggestedPath: suggestedPath,
          hasPrefix: hasPrefix,
        };
      }
    } catch (e) {
      console.error("Error analyzing URL:", e);
    }
  }

  // Default: unknown format
  return {
    type: "unknown",
    originalUrl: url,
    extractedPath: null,
    suggestedPath: null,
    hasPrefix: false,
  };
}

// Server-side utilities have been moved to lib/server-image-utils.ts
