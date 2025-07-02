"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/app/supabase-browser";
import { Button } from "@/components/ui/button";

export default function ImageDebugger() {
  const [posts, setPosts] = useState<
    Array<{ id: string; title: string; image_url?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, image_url")
        .limit(5);

      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching posts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testImageUrl = async (url: string) => {
    try {
      // Check both direct and path interpretations
      const supabase = createBrowserClient();

      // Direct URL test
      try {
        const response = await fetch(url, { method: "HEAD" });
        console.log(`Direct URL test result: ${response.status}`);
      } catch (e) {
        console.log(`Direct URL test failed: ${e}`);
      }

      // Path interpretation test
      try {
        if (url.startsWith("blog/") || url.startsWith("post-images/")) {
          const { data } = supabase.storage
            .from("blog-images")
            .getPublicUrl(url);
          const publicUrl = data.publicUrl;
          console.log(`Path generated URL: ${publicUrl}`);

          // Try to access this URL
          const response = await fetch(publicUrl, { method: "HEAD" });
          console.log(`Path URL test result: ${response.status}`);
        } else {
          console.log("URL doesn't appear to be a valid path");
        }
      } catch (e) {
        console.log(`Path URL test failed: ${e}`);
      }
    } catch (e) {
      console.error("Error testing URL:", e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Image URL Debugger</h2>

      {error && <p className="text-red-500">Error: {error}</p>}

      {loading ? (
        <p>Loading posts...</p>
      ) : (
        <div className="space-y-6">
          <Button onClick={fetchPosts} variant="outline">
            Refresh Posts
          </Button>

          <h3 className="text-xl font-bold mt-4">Post Images</h3>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border p-4 rounded">
                <h4 className="font-medium">{post.title}</h4>
                <p className="break-all mt-2">
                  <span className="font-mono text-sm">image_url:</span>{" "}
                  {post.image_url || "(none)"}
                </p>

                <div className="mt-4 space-x-2">
                  {post.image_url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testImageUrl(post.image_url || "")}
                      >
                        Test URL Access
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(post.image_url || "")
                        }
                      >
                        Copy URL
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
