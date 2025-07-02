"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { validateImageUrl, generateAlternativeUrls } from "@/lib/storage-utils";
import { toast } from "sonner";

interface FeaturedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FeaturedImage({
  src,
  alt,
  className = "",
}: FeaturedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [alternativeUrls, setAlternativeUrls] = useState<string[]>([]);

  useEffect(() => {
    // Reset error state when source changes
    setImageError(false);
    setUseDirectUrl(false);
    setRetryCount(0);
    setAlternativeUrls([]);

    // Validate the image URL
    if (src) {
      const validatedUrl = validateImageUrl(src, useDirectUrl);
      console.log(
        `Original URL: ${src}, Validated URL: ${validatedUrl}, Direct URL: ${useDirectUrl}`
      );
      setImageUrl(validatedUrl);

      // Generate alternative URLs in case the main one fails
      setAlternativeUrls(generateAlternativeUrls(validatedUrl));
    }
  }, [src, useDirectUrl]);

  if (!src || imageError) return null;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-lg ${className}`}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          unoptimized={true}
          onError={() => {
            console.error("Featured image failed to load:", imageUrl);

            // Try alternative URLs one by one
            if (retryCount < alternativeUrls.length) {
              const nextUrl = alternativeUrls[retryCount];
              console.log(
                `Trying alternative URL (${retryCount + 1}/${
                  alternativeUrls.length
                }):`,
                nextUrl
              );
              setImageUrl(nextUrl);
              setRetryCount(retryCount + 1);
            } else if (!useDirectUrl) {
              // If no alternatives worked, try with direct download URL
              console.log("Trying direct download URL as fallback");
              setUseDirectUrl(true);
              setRetryCount(0);
            } else {
              // If everything failed, show an error and hide the image
              console.error("All image loading attempts failed");
              toast.error("Failed to load image");
              setImageError(true);
            }
          }}
        />
      )}
    </div>
  );
}
