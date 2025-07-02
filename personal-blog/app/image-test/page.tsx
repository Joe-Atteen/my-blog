"use client";

import { useState, useEffect } from "react";
import { SupabaseImage } from "@/components/ui/supabase-image";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/app/supabase-browser";

export default function ImageTestPage() {
  const [testPath, setTestPath] = useState("blog/test-image.png");
  const [directUrl, setDirectUrl] = useState("");
  const [s3Url, setS3Url] = useState("");
  const [standardUrl, setStandardUrl] = useState("");
  const [status, setStatus] = useState<{ [key: string]: string }>({});

  const supabase = createBrowserClient();
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "blog-images";

  // Generate test URLs
  useEffect(() => {
    if (!testPath) return;

    const generateAndTestUrls = () => {
      // Generate standard URL
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testPath);
      setStandardUrl(data.publicUrl);

      // Generate S3 URL (without 'public' in the path)
      setS3Url(`${baseUrl}/storage/v1/object/${BUCKET_NAME}/${testPath}`);

      // Generate direct download URL
      const directUrl = new URL(data.publicUrl);
      directUrl.searchParams.set("download", "");
      setDirectUrl(directUrl.toString());

      // Test URLs
      testUrlAccess(data.publicUrl, "standard");
      testUrlAccess(
        `${baseUrl}/storage/v1/object/${BUCKET_NAME}/${testPath}`,
        "s3"
      );
      testUrlAccess(directUrl.toString(), "direct");
    };

    generateAndTestUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testPath]);

  // Function to test URL accessibility
  async function testUrlAccess(url: string, type: string) {
    try {
      setStatus((prev) => ({ ...prev, [type]: "Testing..." }));

      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        setStatus((prev) => ({
          ...prev,
          [type]: `✅ Success (${response.status})`,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          [type]: `❌ Failed (${response.status})`,
        }));
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setStatus((prev) => ({ ...prev, [type]: `❌ Error: ${errorMessage}` }));
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Image Display Test Page</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Image Path</h2>
        <input
          type="text"
          value={testPath}
          onChange={(e) => setTestPath(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="Enter image path (e.g. blog/test-image.png)"
        />
        <Button
          onClick={() => {
            testUrlAccess(standardUrl, "standard");
            testUrlAccess(s3Url, "s3");
            testUrlAccess(directUrl, "direct");
          }}
        >
          Retest URLs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            SupabaseImage Component Test
          </h2>
          <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-4">
            <SupabaseImage src={testPath} alt="Test Image" fill={true} />
          </div>
          <p className="text-sm">
            Using path:{" "}
            <code className="bg-gray-100 p-1 rounded">{testPath}</code>
          </p>
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Direct IMG Tag Test</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">
                Standard URL: {status.standard || "Not tested"}
              </h3>
              <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                <Image
                  src={standardUrl}
                  alt="Standard URL Test"
                  width={800}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs break-all overflow-x-auto">{standardUrl}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                S3 URL: {status.s3 || "Not tested"}
              </h3>
              <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                <Image
                  src={s3Url}
                  alt="S3 URL Test"
                  width={800}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs break-all overflow-x-auto">{s3Url}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                Direct Download URL: {status.direct || "Not tested"}
              </h3>
              <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                <Image
                  src={directUrl}
                  alt="Direct URL Test"
                  width={800}
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs break-all overflow-x-auto">{directUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Image URL Format Test Results
        </h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-2">URL Type</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">Standard URL</td>
              <td className="p-2">{status.standard || "Not tested"}</td>
            </tr>
            <tr>
              <td className="p-2">S3 URL</td>
              <td className="p-2">{status.s3 || "Not tested"}</td>
            </tr>
            <tr>
              <td className="p-2">Direct Download URL</td>
              <td className="p-2">{status.direct || "Not tested"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          Troubleshooting Recommendations
        </h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            If none of the URLs work, check bucket permissions in Supabase.
          </li>
          <li>
            If S3 URL works but standard doesn&apos;t, update{" "}
            <code className="bg-gray-100 p-1 rounded">getCorrectImageUrl</code>{" "}
            in{" "}
            <code className="bg-gray-100 p-1 rounded">
              supabase-image-utils.ts
            </code>
            .
          </li>
          <li>
            If direct URL works but others don&apos;t, check CORS settings.
          </li>
          <li>
            Verify that your Next.js configuration allows all the URL formats in{" "}
            <code className="bg-gray-100 p-1 rounded">next.config.js</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}
