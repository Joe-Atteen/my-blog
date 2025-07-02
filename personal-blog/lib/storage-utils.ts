"use client";

import { createBrowserClient } from "@/app/supabase-browser";
import { toast } from "sonner";

// Get the bucket name from environment variables or fallback to default
const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

/**
 * Checks if the blog-images bucket exists
 * This helps identify configuration issues early
 */
export async function checkBucketExists(): Promise<boolean> {
  try {
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.log("Checking if blog-images bucket exists");
    }

    const supabase = createBrowserClient();

    // Try to get a file from the bucket
    const { error } = await supabase.storage.from(BUCKET_NAME).list("", {
      limit: 1, // Just check for one file to minimize data transfer
    });

    if (error) {
      console.error("Error accessing blog-images bucket:", error.message);
      toast.error(
        "Unable to access storage bucket. Check Supabase settings and permissions."
      );
      return false;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Blog images bucket exists and is accessible");
    }
    return true;
  } catch (e) {
    console.error("Unexpected error checking bucket:", e);
    return false;
  }
}

/**
 * Gets the public URL for an image path
 */
export function getImageUrl(path: string): string {
  if (!path) return "";

  const supabase = createBrowserClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Validates and potentially fixes an image URL from Supabase
 * @param url The URL to validate
 * @param useDirectDownload Whether to use a direct download URL (helps with CORS)
 */
export function validateImageUrl(
  url: string,
  useDirectDownload: boolean = false
): string {
  if (!url) return "";

  console.log("Validating image URL:", url);

  // Clean up the URL if it has extra quotes (common issue)
  url = url.replace(/^["'](.+)["']$/, "$1");

  // Extract path if it's a full Supabase URL
  // Note: We need to handle different path patterns:
  // - znphqmblusltnxhsbdnt.supabase.co/storage/v1/object/blog-images/blog/a8929f18-971f-43b8-bd2c-2b1e9313dc4c.JPG
  // - With legacy pattern: znphqmblusltnxhsbdnt.supabase.co/storage/v1/object/public/blog-images/blog/a8929f18-971f-43b8-bd2c-2b1e9313dc4c.JPG
  let path = "";
  if (url.includes("/storage/v1/object/blog-images/")) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/object/blog-images/");
      if (pathParts.length > 1) {
        path = pathParts[1];
        console.log("Extracted path from URL (for debugging):", path);
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
  } else if (url.includes("/storage/v1/object/public/blog-images/")) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/public/blog-images/");
      if (pathParts.length > 1) {
        path = pathParts[1];
        console.log("Extracted path from URL (for debugging):", path);
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
  } else if (
    url.startsWith("post-images/") ||
    url.startsWith("blog/") ||
    (url.includes(".") && !url.includes("/")) // Handle case where only filename is provided
  ) {
    path = url;

    // If only a filename is provided, assume it's in the blog folder
    if (!url.includes("/")) {
      path = `blog/${url}`;
      console.log("Adding default blog/ prefix to path (for debugging):", path);
    }

    // For debugging - log the path
    console.log("Using image path (for debugging):", path);
  } else if (
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes(".png") ||
    url.includes(".gif") ||
    url.includes(".JPG") ||
    url.includes(".JPEG") ||
    url.includes(".PNG") ||
    url.includes(".GIF")
  ) {
    // If URL contains image extension but doesn't match other patterns,
    // try to extract just the filename as a last resort
    try {
      const filename = url.split("/").pop();
      if (filename) {
        // Check if filename starts with a UUID pattern
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-zA-Z]+$/i.test(
            filename
          )
        ) {
          path = `blog/${filename}`;
          console.log(
            "Extracted filename from URL and using blog/ path (for debugging):",
            path
          );
        }
      }
    } catch (e) {
      console.error("Error extracting filename from URL:", e);
    }
  }

  // If we have a valid path, get a fresh URL
  if (path) {
    console.log("Generating fresh URL for path:", path);
    const supabase = createBrowserClient();

    if (useDirectDownload) {
      return getDirectDownloadUrl(path);
    } else {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      return data.publicUrl;
    }
  }

  // If it's already a valid URL, return it
  if (url.startsWith("http") || url.startsWith("https")) {
    console.log("URL appears to be valid:", url);
    return url;
  }

  return url;
}

/**
 * Checks if an image URL is accessible by making a HEAD request
 * This is useful for debugging image loading issues
 */
export async function checkImageUrlAccessible(url: string): Promise<boolean> {
  if (!url) return false;

  if (process.env.NODE_ENV !== "production") {
    console.log("Checking image URL accessibility:", url);
  }

  try {
    // Create an AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Make a HEAD request to check if the image is accessible
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        // Using 'no-cors' mode will always return an opaque response
        // which doesn't let us check status codes
        // Instead we'll rely on the catch block for errors
      });

      clearTimeout(timeoutId);

      // A successful response means the image is accessible
      if (process.env.NODE_ENV !== "production") {
        console.log("Image URL check response:", response.status);
      }
      return response.ok;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Request timed out checking image URL:", url);
    } else {
      console.error("Error checking image URL:", error);
    }
    return false;
  }
}

/**
 * Gets a direct download URL that bypasses CORS issues
 * This creates a special URL that can be used for downloading
 */
export function getDirectDownloadUrl(path: string): string {
  if (!path) return "";

  console.log("Getting direct download URL for path:", path);
  const supabase = createBrowserClient();

  // First get the normal public URL
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  if (!publicUrl) return "";

  // Transform the URL to use download parameter
  try {
    const url = new URL(publicUrl);

    // First try the direct download approach
    url.searchParams.set("download", "");

    // Also add a cache busting parameter to avoid browser caching
    url.searchParams.set("_cb", Date.now().toString());

    console.log("Generated direct download URL:", url.toString());
    return url.toString();
  } catch (e) {
    console.error("Error creating download URL:", e);
    return publicUrl;
  }
}

/**
 * Gets a URL that will work with Next.js Image component
 * This ensures the URL is properly structured for Next.js image optimization
 */
export function getNextImageUrl(url: string): string {
  if (!url) return "";

  // If the URL is already valid but has issues with Next.js Image
  if (url.includes("/storage/v1/object/blog-images/")) {
    try {
      // Parse the URL to extract the path and build a fresh URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/object/blog-images/");
      if (pathParts.length > 1) {
        const path = pathParts[1];
        const supabase = createBrowserClient();
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        console.log(`Regenerated URL for Next.js Image: ${data.publicUrl}`);
        return data.publicUrl;
      }
    } catch (e) {
      console.error("Error generating Next.js compatible URL:", e);
    }
  } else if (url.includes("/storage/v1/object/public/blog-images/")) {
    try {
      // Parse the URL to extract the path and build a fresh URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/public/blog-images/");
      if (pathParts.length > 1) {
        const path = pathParts[1];
        const supabase = createBrowserClient();
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        console.log(`Regenerated URL for Next.js Image: ${data.publicUrl}`);
        return data.publicUrl;
      }
    } catch (e) {
      console.error("Error generating Next.js compatible URL:", e);
    }
  }

  // If it's a simple path, generate a URL
  if (url.startsWith("post-images/") || url.startsWith("blog/")) {
    const supabase = createBrowserClient();
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(url);
    return data.publicUrl;
  }

  return url;
}

/**
 * Tries to generate an alternative URL based on the original URL
 * This is useful when the main URL fails and we need to try different paths
 * @param url The original URL that failed
 * @returns An array of alternative URLs to try
 */
export function generateAlternativeUrls(url: string): string[] {
  const alternatives: string[] = [];

  if (!url) return alternatives;

  console.log("Generating alternative URLs for:", url);

  try {
    // Extract the filename from the URL
    const filename = url.split("/").pop();
    if (!filename) return alternatives;

    // Try both folder paths with direct download
    const supabase = createBrowserClient();
    const blogPath = `blog/${filename}`;
    const postImagesPath = `post-images/${filename}`;

    // Add blog/ path with direct download
    const { data: blogData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(blogPath);
    if (blogData.publicUrl) {
      const blogUrl = new URL(blogData.publicUrl);
      blogUrl.searchParams.set("download", "");
      blogUrl.searchParams.set("_cb", Date.now().toString());
      alternatives.push(blogUrl.toString());
    }

    // Add post-images/ path with direct download
    const { data: postData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(postImagesPath);
    if (postData.publicUrl) {
      const postUrl = new URL(postData.publicUrl);
      postUrl.searchParams.set("download", "");
      postUrl.searchParams.set("_cb", Date.now().toString());
      alternatives.push(postUrl.toString());
    }

    console.log("Generated alternatives:", alternatives);
  } catch (e) {
    console.error("Error generating alternative URLs:", e);
  }

  return alternatives;
}
