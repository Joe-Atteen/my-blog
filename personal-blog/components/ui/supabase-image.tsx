"use client";

// SupabaseImage Component
//
// This component handles displaying images from Supabase Storage with robust error handling.
// Since public bucket access isn't working correctly, we use signed URLs as our primary strategy.
//
// Key features:
// - Uses signed URLs that expire after 12 hours
// - Implements an hourly refresh mechanism to prevent URL expiration
// - Global refresh system for when a user returns to the tab after being away
// - Multiple fallback strategies if signed URLs fail
// - Comprehensive error handling and loading states

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  getCorrectImageUrl,
  getDirectImageUrl,
} from "@/lib/supabase-image-utils";
import { createBrowserClient } from "@/app/supabase-browser";
import { Loader2 } from "lucide-react";

// Constants
const SIGNED_URL_EXPIRY_SECONDS = 12 * 60 * 60; // 12 hours
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // Refresh every hour

// Add global type definitions
declare global {
  interface Window {
    __supabaseImageRefreshSetup?: boolean;
  }
}

interface SupabaseImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
}

export function SupabaseImage({
  src,
  alt,
  className = "",
  width,
  height,
  fill = false,
  priority = false,
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryStrategy, setRetryStrategy] = useState<
    "direct" | "unoptimized" | "original" | "s3format" | "signed"
  >("original");

  // Add a ref for the refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add global URL refresh mechanism
  useEffect(() => {
    // Check if this component is the first to set up the global refresh
    if (!window.__supabaseImageRefreshSetup && retryStrategy === "signed") {
      window.__supabaseImageRefreshSetup = true;

      // Set up event listener for visibility change to handle tab focus
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          // When tab becomes visible, check if we need to refresh URLs
          const lastRefresh = parseInt(
            localStorage.getItem("supabaseImageLastRefresh") || "0"
          );
          const now = Date.now();

          // If it's been more than 1 hour since last refresh, trigger refresh
          if (now - lastRefresh > 60 * 60 * 1000) {
            console.log(
              "Tab became visible after long time, refreshing image URLs"
            );
            // Using a custom event to notify all image components to refresh
            window.dispatchEvent(new CustomEvent("supabaseImageRefreshNeeded"));
            localStorage.setItem("supabaseImageLastRefresh", now.toString());
          }
        }
      });
    }

    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      console.log("Global image refresh triggered");
      setRetryCount((prevCount) => prevCount + 1);
    };

    window.addEventListener("supabaseImageRefreshNeeded", handleGlobalRefresh);

    return () => {
      window.removeEventListener(
        "supabaseImageRefreshNeeded",
        handleGlobalRefresh
      );
    };
  }, [retryStrategy]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Process the image URL
  useEffect(() => {
    const processImage = async () => {
      if (!src) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(false);

        console.log("SupabaseImage processing:", src);

        // Add diagnostic info - check what format we have
        if (src.startsWith("blog/") || src.startsWith("post-images/")) {
          console.log("✓ URL is in correct path format");
        } else if (src.includes("storage") && src.includes("supabase")) {
          console.log(
            "⚠️ URL is a full Supabase URL, will attempt to extract path"
          );
        } else {
          console.log("⚠️ URL is in unknown format, attempting to handle");
        }

        // Get the path from the source
        const path =
          src.startsWith("blog/") || src.startsWith("post-images/")
            ? src
            : `blog/${src}`;

        // Generate a signed URL as the primary strategy
        const supabase = createBrowserClient();
        let url;

        try {
          // Generate a signed URL that expires in 12 hours
          const { data, error: signedUrlError } = await supabase.storage
            .from("blog-images")
            .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

          if (signedUrlError) {
            throw signedUrlError;
          }

          if (data && data.signedUrl) {
            console.log(
              "Using signed URL as primary strategy:",
              data.signedUrl
            );
            url = data.signedUrl;
            setRetryStrategy("signed");

            // Store last refresh time in localStorage
            localStorage.setItem(
              "supabaseImageLastRefresh",
              Date.now().toString()
            );

            // Set up a refresh timer - refresh every hour for safety
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
            }

            refreshTimerRef.current = setTimeout(() => {
              console.log("Refreshing signed URL (hourly refresh)");
              // Force a refresh of the image URL without changing retry strategy
              setRetryCount((prevCount) => prevCount + 1);

              // Also notify other components that might need refreshing
              window.dispatchEvent(
                new CustomEvent("supabaseImageRefreshNeeded")
              );
            }, REFRESH_INTERVAL_MS); // 1 hour
          } else {
            throw new Error("No signed URL returned");
          }
        } catch (e) {
          console.error("Error creating signed URL:", e);

          // Fall back to other strategies if signed URL fails
          if (retryCount === 0) {
            // First fallback: try direct download URL
            url = await getDirectImageUrl(src);
            setRetryStrategy("direct");
          } else if (retryCount === 1) {
            // Second fallback: try standard path
            url = await getCorrectImageUrl(src);
            setRetryStrategy("original");
          } else {
            // Last resort: try S3 format URL
            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            url = `${baseUrl}/storage/v1/object/blog-images/${path}`;
            console.log("Trying with direct object path:", url);
            setRetryStrategy("s3format");
          }
        }

        console.log(
          `Image URL (retry ${retryCount}, strategy: ${retryStrategy}):`,
          url
        );
        setImageUrl(url);
      } catch (e) {
        console.error("Error processing image:", e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    processImage();
  }, [src, retryCount, retryStrategy]);

  // Get configuration from environment variables
  const allowUnoptimized =
    process.env.NEXT_PUBLIC_ALLOW_UNOPTIMIZED_IMAGES === "true";

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className} ${
          fill ? "w-full h-full" : ""
        }`}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error || !imageUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 ${className} ${
          fill ? "w-full h-full" : ""
        }`}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-500 mb-2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p className="text-sm text-red-500">Image not available</p>
        <p className="text-xs text-red-400 mt-1 px-2 text-center">
          Check storage bucket permissions
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className} ${
        fill ? "w-full h-full" : ""
      }`}
      style={{
        width: fill ? "100%" : width,
        height: fill ? "100%" : height,
      }}
    >
      {fill ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority={priority}
          // Use unoptimized based on env variable, retry strategy, or URL
          unoptimized={
            allowUnoptimized ||
            retryStrategy === "unoptimized" ||
            imageUrl.includes("supabase")
          }
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => {
            console.error("Image failed to load:", imageUrl);
            if (retryCount < 3) {
              console.log(`Retrying with strategy ${retryCount + 1}`);
              setRetryCount(retryCount + 1);
            } else {
              console.error("All retry strategies failed for image:", src);
              setError(true);
            }
          }}
        />
      ) : (
        <Image
          src={imageUrl}
          alt={alt}
          width={width || 800}
          height={height || 600}
          priority={priority}
          // Use unoptimized based on env variable, retry strategy, or URL
          unoptimized={
            allowUnoptimized ||
            retryStrategy === "unoptimized" ||
            imageUrl.includes("supabase")
          }
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => {
            console.error("Image failed to load:", imageUrl);
            if (retryCount < 3) {
              console.log(`Retrying with strategy ${retryCount + 1}`);
              setRetryCount(retryCount + 1);
            } else {
              console.error("All retry strategies failed for image:", src);
              setError(true);
            }
          }}
        />
      )}
    </div>
  );
}
