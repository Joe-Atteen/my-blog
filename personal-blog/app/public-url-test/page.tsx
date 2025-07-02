"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/app/supabase-browser";

export default function TestPublicUrlPage() {
  const [imagePath, setImagePath] = useState(
    "blog/e0aff22f-0408-4e36-81ed-459bec630c80.jpeg"
  );
  const [publicUrl, setPublicUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState("");

  const supabase = createBrowserClient();
  const BUCKET_NAME = "blog-images";

  // Generate the URL when path changes
  useEffect(() => {
    if (imagePath) {
      try {
        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(imagePath);
        setPublicUrl(data.publicUrl);
      } catch (e) {
        console.error("Error generating URL:", e);
      }
    }
  }, [imagePath, supabase]);

  // Function to test if the URL is accessible
  const testUrl = async () => {
    if (!publicUrl) return;

    setStatus("loading");
    try {
      const response = await fetch(publicUrl, { method: "HEAD" });
      if (response.ok) {
        setStatus("success");
        setResult(
          `✅ Success! Standard public URL is working (${response.status})`
        );
      } else {
        setStatus("error");
        setResult(
          `❌ Error: URL returned ${response.status} ${response.statusText}`
        );
      }
    } catch (e) {
      setStatus("error");
      setResult(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Public URL Test</h1>
      <p className="mb-6 text-gray-600">
        This page tests if your Supabase Storage is correctly configured for
        public access. If the standard public URL works, you don&apos;t need
        signed URLs anymore!
      </p>

      <div className="border rounded-lg p-6 mb-8 bg-white">
        <h2 className="text-xl font-semibold mb-3">Test Configuration</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Image Path:</label>
          <input
            aria-label="Image Path"
            placeholder="Enter image path"
            type="text"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <p className="text-sm text-gray-500">
            Example: blog/e0aff22f-0408-4e36-81ed-459bec630c80.jpeg
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Generated Public URL:
          </label>
          <div className="bg-gray-100 p-2 rounded break-all font-mono text-xs">
            {publicUrl || "No URL generated"}
          </div>
        </div>

        <Button onClick={testUrl} disabled={status === "loading"}>
          {status === "loading" ? "Testing..." : "Test URL Access"}
        </Button>
      </div>

      {status !== "idle" && (
        <div
          className={`border rounded-lg p-6 ${
            status === "success"
              ? "bg-green-50 border-green-200"
              : status === "error"
              ? "bg-red-50 border-red-200"
              : "bg-gray-50"
          }`}
        >
          <h2 className="text-xl font-semibold mb-3">Test Result</h2>
          <p className="font-mono">{result}</p>

          {status === "success" && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Image Preview:</h3>
              <div className="border rounded max-w-md overflow-hidden">
                <Image
                  src={publicUrl}
                  alt="Test image"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
                <p>
                  Since standard public URLs are working, you can update your{" "}
                  <code>SupabaseImage</code> component to use standard URLs
                  first and fall back to signed URLs only if needed.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-medium text-yellow-800 mb-2">
                Troubleshooting:
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check that your bucket is set to public</li>
                <li>Verify the SELECT policy allows anonymous access</li>
                <li>Make sure the image path is correct</li>
                <li>Try with a different image path</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
