import { createServerClient } from "@/app/supabase-server";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parse an image path to extract bucket and object path
 * Handles various formats of image URLs in the blog system
 */
export function parseImagePath(imagePath: string): {
  bucketName: string;
  objectPath: string;
} {
  // Clean up the URL first
  imagePath = imagePath.trim();

  // Default values
  let bucketName = "blogs"; // Default bucket name
  let objectPath = "";

  // CASE 1: Full Supabase URL with public/ in the path
  if (imagePath.includes("/storage/v1/object/public/")) {
    const urlParts = imagePath.split("/storage/v1/object/public/");
    if (urlParts.length > 1) {
      const pathParts = urlParts[1].split("/");
      bucketName = pathParts[0];
      objectPath = pathParts.slice(1).join("/");
      // Remove query params if present
      objectPath = objectPath.split("?")[0];
    }
  }
  // CASE 2: Signed URL format
  else if (imagePath.includes("/storage/v1/object/sign/")) {
    const match = imagePath.match(
      /\/storage\/v1\/object\/sign\/([^\/]+)\/([^?]+)/
    );
    if (match && match.length >= 3) {
      bucketName = match[1];
      objectPath = match[2];
    }
  }
  // CASE 3: Simple path with bucket/path format (e.g. "blogs/file.jpg")
  else if (imagePath.includes("/") && !imagePath.startsWith("http")) {
    const pathParts = imagePath.split("/");
    bucketName = pathParts[0];
    objectPath = pathParts.slice(1).join("/");
  }
  // CASE 4: Just a filename (e.g. "file.jpg")
  else if (!imagePath.startsWith("http")) {
    objectPath = imagePath;
  }
  // CASE 5: Any other URL format - try to extract filename
  else {
    const lastPart = imagePath.split("/").pop() || "";
    if (lastPart.includes(".")) {
      objectPath = lastPart;
    }
  }

  return { bucketName, objectPath };
}

/**
 * Try to get signed URL from multiple buckets
 * Returns the first successful signed URL or null if all fail
 */
export async function tryMultipleBuckets(
  supabase: SupabaseClient,
  objectPath: string,
  buckets: string[] = ["blogs", "blog", "images", "posts"]
): Promise<string | null> {
  for (const bucket of buckets) {
    try {
      console.log(`Trying bucket: ${bucket} for path: ${objectPath}`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60); // 1 hour expiration

      if (data?.signedUrl && !error) {
        console.log(`Successfully created signed URL with bucket: ${bucket}`);
        return data.signedUrl;
      }
    } catch {
      // Skip this bucket and try next
    }
  }

  return null;
}

/**
 * Generate public URL fallback when signed URLs fail
 */
export function getPublicUrlFallback(imagePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const { bucketName, objectPath } = parseImagePath(imagePath);

  // Ensure we have both bucket and object path
  if (!objectPath) {
    return imagePath; // Return original if we can't parse
  }

  return `${baseUrl}/storage/v1/object/public/${bucketName}/${objectPath}`;
}

/**
 * Main function to get a reliable image URL for API responses
 * Handles all error cases and provides fallbacks
 */
export async function getReliableImageUrl(imagePath: string): Promise<string> {
  if (!imagePath) return "";

  // If already an HTTP(S) URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  try {
    const supabase = await createServerClient();
    const { bucketName, objectPath } = parseImagePath(imagePath);

    if (!objectPath) {
      console.error("Could not extract object path from", imagePath);
      return imagePath;
    }

    console.log(
      `Trying to get signed URL for bucket: ${bucketName}, path: ${objectPath}`
    );

    try {
      // First try with the parsed bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(objectPath, 60 * 60);

      if (data?.signedUrl) {
        return data.signedUrl;
      }

      if (error) {
        throw error;
      }
    } catch (err) {
      // If error is StorageApiError, try alternative buckets
      console.error("Error getting signed URL:", err);

      // Try alternative buckets
      const signedUrl = await tryMultipleBuckets(supabase, objectPath);
      if (signedUrl) {
        return signedUrl;
      }

      // If all signed URL attempts fail, use public URL as fallback
      console.log("All signed URL attempts failed, using public URL fallback");
      return getPublicUrlFallback(imagePath);
    }

    // If we get here, return public URL as fallback
    return getPublicUrlFallback(imagePath);
  } catch (error) {
    console.error("Error in getReliableImageUrl:", error);
    return getPublicUrlFallback(imagePath);
  }
}
