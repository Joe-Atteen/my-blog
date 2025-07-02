"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Direct utility component to load images with fallbacks to multiple URLs
// This uses the simplest, most reliable approach to handle problematic image URLs
export function DirectImage({
  src,
  alt,
  className = "",
  width = 800,
  height = 600,
  fill = true,
  objectFit = "cover",
  onImageError,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onImageError?: () => void;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [error, setError] = useState(false);
  const [triedDirectUrl, setTriedDirectUrl] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setCurrentSrc(src);
    setError(false);
    setTriedDirectUrl(false);
  }, [src]);

  // If both original and direct URLs failed, show nothing
  if (!src || error) return null;

  const handleImageError = () => {
    console.error("Image failed to load:", currentSrc);

    // If we haven't tried a direct URL yet, modify the URL to use direct download
    if (!triedDirectUrl) {
      try {
        // Check if this is a Supabase URL first
        if (
          currentSrc.includes("supabase") &&
          currentSrc.includes("/storage/")
        ) {
          // Try to extract the image path from the URL
          const pathRegex =
            /\/storage\/v\d+\/(?:object|sign)\/(?:public|auth)\/[^/]+\/(.+?)(?:\?|$)/;
          const match = currentSrc.match(pathRegex);

          if (match && match[1]) {
            const path = match[1].split("?")[0]; // Remove query params
            console.log("Extracted path from URL:", path);

            // Try with direct download URL
            const directUrl = new URL(currentSrc);
            directUrl.searchParams.set("download", "");
            directUrl.searchParams.set("_cb", Date.now().toString());

            console.log("Trying direct URL:", directUrl.toString());
            setCurrentSrc(directUrl.toString());
            setTriedDirectUrl(true);
          } else {
            // If we couldn't extract the path, just try with download param
            const directUrl = new URL(currentSrc);
            directUrl.searchParams.set("download", "");
            directUrl.searchParams.set("_cb", Date.now().toString());

            console.log("Trying direct URL:", directUrl.toString());
            setCurrentSrc(directUrl.toString());
            setTriedDirectUrl(true);
          }
        } else {
          // Not a Supabase URL or couldn't parse it, just try adding download param
          const directUrl = new URL(currentSrc);
          directUrl.searchParams.set("download", "");
          directUrl.searchParams.set("_cb", Date.now().toString());

          console.log("Trying direct URL:", directUrl.toString());
          setCurrentSrc(directUrl.toString());
          setTriedDirectUrl(true);
        }
      } catch (e) {
        console.error("Error generating direct URL:", e);
        setError(true);
        if (onImageError) onImageError();
      }
    } else {
      // If direct URL also failed, give up
      setError(true);
      if (onImageError) onImageError();
    }
  };

  const style = fill ? { objectFit } : {};

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {currentSrc &&
        (fill ? (
          <Image
            src={currentSrc}
            alt={alt}
            fill
            style={style}
            sizes="(max-width: 1200px) 100vw, 1200px"
            unoptimized={true}
            onError={handleImageError}
          />
        ) : (
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            style={style}
            unoptimized={true}
            onError={handleImageError}
          />
        ))}
    </div>
  );
}
