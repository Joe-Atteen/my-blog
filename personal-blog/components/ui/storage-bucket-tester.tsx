"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/app/supabase-browser";
// Import removed: toast from sonner
import { Loader2 } from "lucide-react";

export function StorageBucketTester() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const testBucket = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      const supabase = createBrowserClient();
      console.log("Testing Supabase storage bucket...");

      // Try to list files in the bucket
      const { data, error } = await supabase.storage.from("blog-images").list();

      if (error) {
        console.error("Storage bucket error:", error);
        setResult({
          success: false,
          message: `Error accessing bucket: ${error.message}`,
        });
        return;
      }

      setResult({
        success: true,
        message: `Success! Found ${data.length} files in the blog-images bucket.`,
      });
    } catch (e) {
      console.error("Test failed:", e);
      setResult({
        success: false,
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-muted/20">
      <h3 className="font-medium text-lg mb-2">Storage Bucket Tester</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Use this tool to verify if your blog-images storage bucket is configured
        correctly.
      </p>

      <Button onClick={testBucket} disabled={isTesting}>
        {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Test Storage Bucket
      </Button>

      {result && (
        <div
          className={`mt-4 p-3 border rounded ${
            result.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
