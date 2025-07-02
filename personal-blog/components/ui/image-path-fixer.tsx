"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/app/supabase-browser";
import { analyzeImageUrl } from "@/lib/supabase-image-utils";
import { toast } from "sonner";

export function ImagePathFixer() {
  const [loading, setLoading] = useState(false);
  type ImageAnalysisResult = {
    id: string;
    title: string;
    image_url: string;
    analysis: {
      type: string;
      originalUrl: string;
      extractedPath: string | null;
      suggestedPath: string | null;
      hasPrefix: boolean;
    };
    needsFix: boolean;
  };
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);
  const supabase = createBrowserClient();

  const analyzePosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, image_url")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithAnalysis = data
        .filter((post) => post.image_url) // Only posts with images
        .map((post) => {
          const analysis = analyzeImageUrl(post.image_url);
          return {
            ...post,
            analysis,
            needsFix: analysis.type !== "path" || !analysis.hasPrefix,
          };
        });

      setResults(postsWithAnalysis);
    } catch (e) {
      console.error("Error analyzing posts:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fixImageUrl = async (postId: string, suggestedPath: string | null) => {
    if (!suggestedPath) {
      toast.error("No suggested path available");
      return;
    }

    try {
      // Update the post with the corrected path
      const { error } = await supabase
        .from("posts")
        .update({ image_url: suggestedPath })
        .eq("id", postId);

      if (error) throw error;

      toast.success("Image URL fixed successfully");

      // Update local state
      setResults((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              image_url: suggestedPath,
              analysis: analyzeImageUrl(suggestedPath),
              needsFix: false,
            };
          }
          return post;
        })
      );
    } catch (e) {
      console.error("Error fixing image URL:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // Function to fix all image URLs in one go
  const fixAllImageUrls = async () => {
    if (!results.length || !results.some((post) => post.needsFix)) {
      toast.info("No images need fixing");
      return;
    }

    try {
      setLoading(true);
      let fixedCount = 0;

      // Process each post that needs fixing
      for (const post of results.filter((p) => p.needsFix)) {
        if (post.analysis.suggestedPath) {
          const { error } = await supabase
            .from("posts")
            .update({ image_url: post.analysis.suggestedPath })
            .eq("id", post.id);

          if (error) {
            console.error(`Error fixing image URL for post ${post.id}:`, error);
          } else {
            fixedCount++;
          }
        }
      }

      // Update local state to reflect changes
      setResults((prev) =>
        prev.map((post) => {
          if (post.needsFix && post.analysis.suggestedPath) {
            return {
              ...post,
              image_url: post.analysis.suggestedPath,
              analysis: analyzeImageUrl(post.analysis.suggestedPath),
              needsFix: false,
            };
          }
          return post;
        })
      );

      toast.success(`Fixed ${fixedCount} image URLs successfully`);
    } catch (e) {
      console.error("Error fixing all image URLs:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Image Path Analyzer & Fixer</h3>
        <div className="flex space-x-2">
          <Button onClick={analyzePosts} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Post Images"}
          </Button>
          {results.filter((p) => p.needsFix).length > 0 && (
            <Button
              onClick={fixAllImageUrls}
              disabled={loading}
              variant="destructive"
            >
              Fix All Images
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm mb-4">
        <p>
          This tool helps identify and fix image URL inconsistencies in your
          posts. It ensures all images use the correct path format.
        </p>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm mb-2">
            {results.filter((p) => p.needsFix).length} posts need fixing.
          </div>

          <Button onClick={fixAllImageUrls} disabled={loading} className="mb-4">
            {loading ? "Fixing..." : "Fix All Images"}
          </Button>

          {results.map((post) => (
            <div
              key={post.id}
              className={`p-4 border rounded-md ${
                post.needsFix
                  ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                  : "border-green-300 bg-green-50 dark:bg-green-900/20"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{post.title}</h4>
                  <div className="text-xs mt-1 font-mono overflow-hidden text-ellipsis">
                    Current: {post.image_url}
                  </div>

                  <div className="mt-2 text-xs space-y-1">
                    <div>
                      Type:{" "}
                      <span className="font-mono">{post.analysis.type}</span>
                    </div>
                    {post.analysis.extractedPath && (
                      <div>
                        Extracted path:{" "}
                        <span className="font-mono">
                          {post.analysis.extractedPath}
                        </span>
                      </div>
                    )}
                    {post.analysis.suggestedPath && (
                      <div>
                        Suggested path:{" "}
                        <span className="font-mono">
                          {post.analysis.suggestedPath}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {post.needsFix && post.analysis.suggestedPath && (
                  <Button
                    size="sm"
                    onClick={() =>
                      fixImageUrl(post.id, post.analysis.suggestedPath)
                    }
                    className="ml-4"
                  >
                    Fix Path
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
