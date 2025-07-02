"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { validateImageUrl, checkImageUrlAccessible } from "@/lib/storage-utils";
import { Loader2 } from "lucide-react";

export function ImageDebugger() {
  const [imageUrl, setImageUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<
    Array<{
      type: string;
      url: string;
      success?: boolean;
      error?: string;
    }>
  >([]);

  const testImage = async () => {
    if (!inputUrl) return;

    setIsValidating(true);
    setResults([]);

    try {
      // Test the original URL
      setResults((prev) => [
        ...prev,
        {
          type: "Original URL",
          url: inputUrl,
        },
      ]);

      // Test validated URL (regular)
      const validatedUrl = validateImageUrl(inputUrl, false);
      setResults((prev) => [
        ...prev,
        {
          type: "Validated URL",
          url: validatedUrl,
        },
      ]);

      // Test with direct download URL
      const directUrl = validateImageUrl(inputUrl, true);
      setResults((prev) => [
        ...prev,
        {
          type: "Direct Download URL",
          url: directUrl,
        },
      ]);

      // Set the main image URL to display
      setImageUrl(validatedUrl);

      // Check accessibility
      const isAccessible = await checkImageUrlAccessible(validatedUrl);
      setResults((prev) =>
        prev.map((r) =>
          r.type === "Validated URL"
            ? {
                ...r,
                success: isAccessible,
                error: isAccessible ? undefined : "URL may not be accessible",
              }
            : r
        )
      );
    } catch (error) {
      console.error("Error testing image:", error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Image URL Debugger</h2>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter an image URL to validate and test it:
        </p>

        <div className="flex gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter image URL"
            className="flex-1"
          />
          <Button onClick={testImage} disabled={isValidating || !inputUrl}>
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test
          </Button>
        </div>
      </div>

      {imageUrl && (
        <div className="space-y-4">
          <h3 className="font-medium">Image Preview</h3>
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
            <Image
              src={imageUrl}
              alt="Test image"
              fill
              className="object-cover"
              unoptimized={true}
              onError={() => console.error("Test image failed to load")}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">URL Analysis</h3>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className="text-sm p-2 border rounded-md overflow-hidden"
              >
                <div className="font-medium flex items-center gap-2">
                  {result.type}
                  {result.success !== undefined && (
                    <span
                      className={
                        result.success ? "text-green-500" : "text-red-500"
                      }
                    >
                      {result.success ? "✓" : "✗"}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-1 break-all">{result.url}</div>
                {result.error && (
                  <div className="text-xs mt-1 text-red-500">
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
