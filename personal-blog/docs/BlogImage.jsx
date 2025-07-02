import React, { useState, useEffect } from "react";

const BlogImage = ({
  src,
  alt,
  className,
  onError,
  blogDomain = "https://your-blog-domain.com",
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset state when src changes
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = async () => {
    // Only attempt to refresh a few times to prevent infinite loops
    if (retryCount >= 2) {
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
      return;
    }

    try {
      // Try to refresh the image URL
      const refreshUrl = `${blogDomain}/api/refresh-image?path=${encodeURIComponent(
        imageSrc
      )}`;
      const response = await fetch(refreshUrl);

      if (!response.ok) {
        throw new Error("Failed to refresh image URL");
      }

      const data = await response.json();

      if (data.url) {
        console.log("Refreshed image URL:", data.url);
        setImageSrc(data.url);
        setRetryCount((prev) => prev + 1);
      } else {
        throw new Error("No URL returned from refresh endpoint");
      }
    } catch (error) {
      console.error("Error refreshing image:", error);
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
    }
  };

  return (
    <div className={`blog-image-container ${className || ""}`}>
      {isLoading && (
        <div className="blog-image-loading-placeholder">
          <div className="spinner"></div>
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        className={`blog-image ${hasError ? "blog-image-error" : ""}`}
        style={{ display: isLoading ? "none" : "block" }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {hasError && (
        <div className="blog-image-error-placeholder">
          <span>Image not available</span>
        </div>
      )}
    </div>
  );
};

export default BlogImage;

// Add this CSS to your portfolio:
/*
.blog-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.blog-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-image-loading-placeholder,
.blog-image-error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f3f4f6;
}

.blog-image-error-placeholder {
  color: #6b7280;
  font-size: 0.875rem;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid #3b82f6;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/
