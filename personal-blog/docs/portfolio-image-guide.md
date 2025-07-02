# Handling Blog Images in Your Portfolio

This guide explains how to properly display blog post images in your React portfolio, dealing with Supabase storage restrictions.

## The Challenge with Supabase Storage Images

Supabase storage has access restrictions that can prevent images from displaying correctly in external sites. This happens because:

1. Public bucket access might be restricted
2. Direct URL access may be blocked by CORS policies
3. Image URLs may require authentication

## Solution: Using Signed URLs

Our API endpoints now generate signed URLs for images, which provide temporary access. However, these URLs expire after one hour, which requires special handling in your portfolio.

## Implementation Options

### Option 1: Use Our Custom Image Component

We've created a special React component that handles image refreshing automatically. Copy this component to your portfolio project:

```jsx
// BlogImage.jsx
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
```

Then add this CSS to your styles:

```css
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

Use the component in your BlogCard:

```jsx
import BlogImage from "./BlogImage";

const BlogCard = ({ post }) => {
  return (
    <div className="blog-card">
      {post.image_url && (
        <div className="blog-card-image">
          <BlogImage
            src={post.image_url}
            alt={post.title}
            blogDomain="https://your-blog-domain.com" // Replace with your actual domain
          />
        </div>
      )}
      <div className="blog-card-content">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <Link to={`/blog/${post.slug}`} className="read-more">
          Read more →
        </Link>
      </div>
    </div>
  );
};
```

### Option 2: Periodically Refresh All Blog Data

Another approach is to simply refresh all blog data periodically:

```jsx
const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        "https://your-blog-domain.com/api/public-posts"
      );
      const data = await response.json();
      setPosts(data.posts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Refresh data every 50 minutes (before the 1-hour expiration)
    const interval = setInterval(fetchPosts, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Rest of your component...
};
```

## Best Practices

1. **Set the correct blogDomain** in the BlogImage component to match your actual blog URL.

2. **Use the BlogImage component** for all blog images in your portfolio, including on detail pages.

3. **Consider caching**: If a user visits multiple pages with the same image, you might want to implement a simple cache to avoid unnecessary refreshes.

4. **Handle errors gracefully**: Always provide fallbacks when images fail to load.

5. **Monitor usage**: Keep an eye on your Supabase storage limits and access patterns.

## Troubleshooting

If images still don't load correctly:

1. Check your browser console for errors
2. Verify that CORS is properly configured in your Supabase dashboard
3. Ensure your storage bucket permissions are set correctly
4. Try accessing the image URL directly in a browser to see the specific error

For additional help, check your Supabase storage logs or contact support.
