"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectImage } from "./direct-image";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./card";

/**
 * A utility to help diagnose and fix problematic image URLs
 * Add this to your admin debug page
 */
export function ImageFixer() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showImage, setShowImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const checkImage = () => {
    setShowImage(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate diagnostic info for the URL
  const getDiagnostics = (url: string) => {
    if (!url) return "No URL provided";

    let diagnostics = "";

    // Check if it's a Supabase URL
    if (url.includes("supabase.co/storage")) {
      diagnostics += "✓ Is a Supabase URL\n";

      // Check path format
      if (url.includes("/public/blog-images/")) {
        diagnostics += "✓ Contains public/blog-images path\n";

        // Extract subpath
        const pathMatch = url.match(/\/public\/blog-images\/([^?]+)/);
        if (pathMatch && pathMatch[1]) {
          diagnostics += `📁 Subpath: ${pathMatch[1]}\n`;

          // Check if path has blog/ or post-images/ prefix
          if (pathMatch[1].startsWith("blog/")) {
            diagnostics += "📂 Uses blog/ folder prefix\n";
          } else if (pathMatch[1].startsWith("post-images/")) {
            diagnostics += "📂 Uses post-images/ folder prefix\n";
          } else {
            diagnostics += "⚠️ No folder prefix detected\n";
          }
        }
      } else {
        diagnostics += "❌ Missing expected path pattern\n";
      }

      // Check for download parameter
      if (url.includes("?download=")) {
        diagnostics += "✓ Has download parameter\n";
      } else {
        diagnostics += "❌ Missing download parameter\n";
      }
    } else {
      diagnostics += "❌ Not a Supabase URL\n";
    }

    return diagnostics;
  };

  const fixUrl = (url: string) => {
    if (!url) return url;

    try {
      // Check if it's a Supabase URL
      if (url.includes("supabase.co/storage")) {
        // Extract the path after blog-images
        const pathMatch = url.match(/\/public\/blog-images\/([^?]+)/);
        if (pathMatch && pathMatch[1]) {
          // Create a new URL with the download parameter
          const newUrl = new URL(url);
          newUrl.searchParams.set("download", "");
          newUrl.searchParams.set("_cb", Date.now().toString());
          return newUrl.toString();
        }
      }
    } catch (e) {
      console.error("Error fixing URL:", e);
    }

    return url;
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Image URL Fixer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste problematic image URL here"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={checkImage}>Check Image</Button>
            <Button
              variant="outline"
              onClick={() => setImageUrl(fixUrl(imageUrl))}
            >
              Fix URL
            </Button>
          </div>

          {imageUrl && (
            <div className="mt-2">
              <h3 className="text-sm font-medium mb-2">Diagnostic Info:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs whitespace-pre-wrap">
                {getDiagnostics(imageUrl)}
              </pre>
            </div>
          )}

          {showImage && imageUrl && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Image Preview:</h3>
              <div className="border rounded-md overflow-hidden aspect-video">
                <DirectImage
                  src={imageUrl}
                  alt="Image preview"
                  onImageError={handleImageError}
                  fill={true}
                />
              </div>
              {imageError && (
                <div className="mt-2 text-red-500 text-sm">
                  Failed to load image with current URL
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        This tool helps diagnose and fix problematic image URLs.
      </CardFooter>
    </Card>
  );
}
