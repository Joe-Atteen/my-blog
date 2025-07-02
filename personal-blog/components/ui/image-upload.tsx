"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/app/supabase-browser";
import { v4 as uuid } from "uuid";
import Image from "next/image";
import { checkBucketExists, validateImageUrl } from "@/lib/storage-utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [bucketChecked, setBucketChecked] = useState(false);
  const supabase = createBrowserClient();

  // Check if bucket exists on component mount
  useEffect(() => {
    if (!bucketChecked) {
      checkBucketExists().then((exists) => {
        setBucketChecked(true);
        if (!exists) {
          setError("Storage not configured. Run 'yarn setup:storage'");
        }
      });
    }
  }, [bucketChecked]);

  // Function to handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("Image upload initiated");
    const file = event.target.files?.[0];

    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log(
      `File selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
    );

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Check auth status first
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) {
        console.error("Auth error during upload:", authError);

        // Handle specific refresh token errors
        if (
          authError.message?.includes("Invalid Refresh Token") ||
          authError.code === "refresh_token_not_found"
        ) {
          // Clear any stale tokens
          localStorage.removeItem("sb-refresh-token");
          localStorage.removeItem("sb-access-token");
          localStorage.removeItem("supabase.auth.token");

          console.log("Cleared invalid auth tokens");
          setError("Your session has expired. Redirecting to login...");

          // Redirect to login after a brief delay to show the error
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }

        // Handle other auth errors
        setError("Authentication error. Please try logging in again.");
        return;
      }

      if (!session) {
        console.error("No active session found");
        setError("You need to be logged in to upload images. Redirecting...");

        // Redirect to login after a brief delay to show the error
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      // Create a unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = `${uuid()}.${fileExtension}`;

      // Use consistent folder structure - always use blog/ prefix
      const filePath = `blog/${fileName}`;

      console.log(`Uploading file to path: ${filePath}`);

      // Setup progress tracking
      let uploadProgress = 0;
      const progressInterval = setInterval(() => {
        if (uploadProgress < 90) {
          uploadProgress += 5;
          setUploadProgress(uploadProgress);
        }
      }, 300);

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      console.log("Upload successful, retrieving public URL");

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      console.log("Public URL:", publicUrlData.publicUrl);

      // Set the URL as the value - store the path, not the full URL for portability
      onChange(filePath);
    } catch (e) {
      console.error("Error uploading image:", e);
      setError(e instanceof Error ? e.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  // State to track image URL and loading
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Get a signed URL for the image to ensure it displays properly
  useEffect(() => {
    async function getImageUrl() {
      if (!value) {
        setImageUrl("");
        return;
      }

      try {
        // Try to get a signed URL first (this is more reliable)
        const supabase = createBrowserClient();
        const path =
          value.startsWith("blog/") || value.startsWith("post-images/")
            ? value
            : `blog/${value}`;

        // Get a signed URL that lasts 12 hours
        const { data, error } = await supabase.storage
          .from("blog-images")
          .createSignedUrl(path, 12 * 60 * 60);

        if (error || !data?.signedUrl) {
          // Fall back to standard URL method if signed URL fails
          const standardUrl = validateImageUrl(value, imageLoadFailed);
          setImageUrl(standardUrl);
        } else {
          setImageUrl(data.signedUrl);
        }
      } catch (e) {
        console.error("Error getting image URL:", e);
        // Fall back to standard URL as last resort
        const fallbackUrl = validateImageUrl(value, imageLoadFailed);
        setImageUrl(fallbackUrl);
      }
    }

    getImageUrl();
    setImageLoadFailed(false);
  }, [value, imageLoadFailed]);

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Post image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized={true}
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);

                  if (!imageLoadFailed) {
                    // Try again with different URL strategy on first failure
                    setImageLoadFailed(true);
                  } else {
                    // If all URL strategies fail, show fallback
                    console.error(
                      "All URL strategies failed for image:",
                      value
                    );
                    e.currentTarget.style.display = "none";

                    // Show a placeholder image element
                    const placeholder = document.createElement("div");
                    placeholder.className =
                      "absolute inset-0 flex items-center justify-center bg-gray-100";
                    placeholder.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                    e.currentTarget.parentNode?.appendChild(placeholder);
                  }
                }}
              />
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute right-2 top-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add("bg-secondary/30");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("bg-secondary/30");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove("bg-secondary/30");

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];

              console.log(
                `File dropped: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
              );

              // Check file type
              if (!file.type.startsWith("image/")) {
                setError("Please select an image file");
                return;
              }

              // Check file size (max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                setError("Image size should be less than 5MB");
                return;
              }

              setIsUploading(true);
              setUploadProgress(0);
              setError(null);

              const fileUploadHandler = async () => {
                try {
                  // Create a unique filename
                  const fileExtension = file.name.split(".").pop();
                  const fileName = `${uuid()}.${fileExtension}`;
                  const filePath = `blog/${fileName}`;

                  console.log(`Uploading dropped file to path: ${filePath}`);

                  // Upload the file to Supabase Storage
                  const { error: uploadError } = await supabase.storage
                    .from("blog-images")
                    .upload(filePath, file);

                  // Update progress manually
                  setUploadProgress(100);

                  if (uploadError) {
                    console.error("Upload error:", uploadError);
                    throw new Error(uploadError.message);
                  }

                  console.log("Upload successful, storing path");

                  // Store just the path, not the full URL
                  onChange(filePath);
                } catch (e) {
                  console.error("Error uploading image:", e);
                  setError(
                    e instanceof Error ? e.message : "Failed to upload image"
                  );
                } finally {
                  setIsUploading(false);
                }
              };

              fileUploadHandler();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="rounded-full bg-secondary p-2">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag and drop an image or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
            {isUploading && (
              <div className="w-full max-w-xs space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-xs">{uploadProgress}% uploaded</p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-secondary relative">
                  <div
                    className={`h-full bg-primary transition-all absolute top-0 left-0 progress-bar-${
                      Math.round(uploadProgress / 10) * 10
                    }`}
                  />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="mt-2"
              >
                Select Image
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
